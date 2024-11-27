import { useState } from 'react';
import Icon from '@components/common/Icon';
import MediaSelectModal from '@components/StudyRoom/MediaSelectModal';

interface ControlBarProps {
  className?: string;
  toggleVideo: () => Promise<boolean>;
  toggleMic: () => boolean;
  toggleChat: () => void;
  exitRoom: () => void;
  isChatOn: boolean;
  getVideoDevices: () => Promise<MediaDeviceInfo[]>;
  getAudioDevices: () => Promise<MediaDeviceInfo[]>;
}

const ControlBar = ({
  className,
  toggleVideo,
  toggleMic,
  toggleChat,
  exitRoom,
  isChatOn,
  getVideoDevices,
  getAudioDevices,
}: ControlBarProps) => {
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isVideoSelectModalOpen, setIsVideoSelectModalOpen] = useState(false);
  const [isAudioSelectModalOpen, setIsAudioSelectModalOpen] = useState(false);

  return (
    <div className={`relative flex gap-10 ${className}`}>
      <div className="bg-gomz-gray-300 flex h-10 w-20 items-center rounded-full">
        <button
          className="bg-gomz-black flex h-10 w-12 items-center justify-center rounded-full"
          onClick={() => toggleVideo().then((result) => setIsVideoOn(result))}
        >
          <Icon
            id={isVideoOn ? 'video' : 'video-off'}
            className="text-gomz-white h-5 w-5 fill-current"
          />
        </button>
        <button
          className="flex h-10 w-6 items-center justify-center rounded-full"
          onClick={() => setIsVideoSelectModalOpen(!isVideoSelectModalOpen)}
        >
          <Icon id="chevron" className="h-5 w-5 rotate-90" />
        </button>
      </div>
      <div className="bg-gomz-gray-300 flex h-10 w-20 items-center rounded-full">
        <button
          className="bg-gomz-black flex h-10 w-12 items-center justify-center rounded-full"
          onClick={() => setIsMicOn(toggleMic())}
        >
          <Icon id={isMicOn ? 'mic' : 'mic-off'} className="text-gomz-white h-6 w-6 fill-current" />
        </button>
        <button
          className="flex h-10 w-6 items-center justify-center rounded-full"
          onClick={() => setIsAudioSelectModalOpen(!isAudioSelectModalOpen)}
        >
          <Icon id="chevron" className="h-5 w-5 rotate-90" />
        </button>
      </div>
      <button
        onClick={toggleChat}
        className="bg-gomz-black relative flex h-10 w-20 items-center rounded-full"
      >
        <div className="flex h-10 w-12 items-center justify-center rounded-full">
          <Icon
            id={isChatOn ? 'chat' : 'chat-off'}
            className="text-gomz-white h-5 w-5 fill-current"
          />
        </div>
        <div className="text-gomz-white absolute left-11 flex h-5 w-5 items-center justify-center rounded-full text-sm">
          0
        </div>
      </button>
      <button
        onClick={exitRoom}
        className="bg-gomz-red flex h-10 w-20 items-center justify-center rounded-full"
      >
        <Icon id="call-end" className="text-gomz-white h-7 w-7 fill-current" />
      </button>
      {isVideoSelectModalOpen && (
        <MediaSelectModal
          className="absolute bottom-0 -translate-y-14 translate-x-10"
          getMediaDevices={getVideoDevices}
        />
      )}
      {isAudioSelectModalOpen && (
        <MediaSelectModal
          className="absolute bottom-0 -translate-y-14 translate-x-40"
          getMediaDevices={getAudioDevices}
        />
      )}
    </div>
  );
};

export default ControlBar;
