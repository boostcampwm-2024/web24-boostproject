import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import signalingClient from '@socket/signalingClient';

interface WebRTCData {
  peerConnection: RTCPeerConnection;
  remoteStream: MediaStream;
  dataChannel: RTCDataChannel;
  nickName: string;
}

interface WebRTCState {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  webRTCMap: React.MutableRefObject<Map<string, WebRTCData>>;
  participantCount: number;
  grid: { cols: number; rows: number };
}

interface WebRTCControls {
  toggleVideo: () => boolean;
  toggleMic: () => boolean;
  exitRoom: () => void;
}

const useWebRTC = (): [WebRTCState, WebRTCControls] => {
  const socket = useRef(io());
  const webRTCMap = useRef(new Map<string, WebRTCData>());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef(new MediaStream());
  const [grid, setGrid] = useState({ cols: 1, rows: 1 });

  const calculateGrid = () => {
    const totalVideos = webRTCMap.current.size + 1;
    const cols = Math.ceil(Math.sqrt(totalVideos));
    const rows = Math.ceil(totalVideos / cols);
    setGrid({ cols, rows });
  };

  const toggleVideo = () => {
    localStreamRef.current.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    return localStreamRef.current.getVideoTracks().every((track) => track.enabled);
  };

  const toggleMic = () => {
    localStreamRef.current.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    return localStreamRef.current.getAudioTracks().every((track) => track.enabled);
  };

  const exitRoom = () => {
    webRTCMap.current.forEach(({ peerConnection }) => {
      peerConnection.close();
    });
    localStreamRef.current.getTracks().forEach((track) => track.stop());
    socket.current.close();
  };

  useEffect(() => {
    const initStream = async () => {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localVideoRef.current!.srcObject = localStreamRef.current;

      toggleVideo();
      toggleMic();

      const observableMap = new Map();
      const set = observableMap.set.bind(observableMap);
      const del = observableMap.delete.bind(observableMap);

      observableMap.set = (key: string, value: WebRTCData) => {
        set(key, value);
        calculateGrid();
        return observableMap;
      };

      observableMap.delete = (key: string) => {
        const result = del(key);
        calculateGrid();
        return result;
      };

      webRTCMap.current = observableMap;

      socket.current = signalingClient(localStreamRef.current, webRTCMap.current);
    };

    initStream();

    return () => exitRoom();
  }, []);

  return [
    {
      localVideoRef,
      webRTCMap,
      participantCount: webRTCMap.current.size + 1,
      grid,
    },
    {
      toggleVideo,
      toggleMic,
      exitRoom,
    },
  ];
};

export default useWebRTC;
