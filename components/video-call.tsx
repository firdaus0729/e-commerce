import { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Alert, Platform, Modal } from 'react-native';
import { ThemedText } from './themed-text';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { brandYellow, brandYellowDark } from '@/constants/theme';
import { API_URL } from '@/constants/config';

interface VideoCallProps {
  visible: boolean;
  onClose: () => void;
  otherUserId: string;
  otherUserName: string;
  postId?: string; // Optional for direct calls
}

export function VideoCall({ visible, onClose, otherUserId, otherUserName, postId }: VideoCallProps) {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const localVideoRef = useRef<any>(null);
  const remoteVideoRef = useRef<any>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Initialize call immediately when modal opens
      initializeCall();
    } else {
      endCall();
    }

    return () => {
      if (visible) {
        endCall();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const initializeCall = async () => {
    try {
      // For mobile, show a simple call interface
      // WebRTC requires native modules (react-native-webrtc) for mobile
      if (Platform.OS !== 'web') {
        // On mobile, just show the call interface
        // In production, you would integrate react-native-webrtc or Agora
        setCallStatus('calling');
        // Simulate call connection after 2 seconds
        setTimeout(() => {
          setCallStatus('connected');
        }, 2000);
        return;
      }

      // Web platform - use WebRTC
      if (!navigator.mediaDevices) {
        Alert.alert('Error', 'WebRTC not supported on this device');
        onClose();
        return;
      }

      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      localStreamRef.current = stream;
      
      // Display local video
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create WebRTC peer connection
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      };

      const peerConnection = new RTCPeerConnection(configuration);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        const remoteStream = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setCallStatus('connected');
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
            socketRef.current.emit('ice-candidate', { to: otherUserId, candidate: event.candidate });
        }
      };

      // Connect to signaling server
      connectSignalingServer();

      setCallStatus('calling');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to initialize call');
      onClose();
    }
  };

  const connectSignalingServer = () => {
    try {
      const io = require('socket.io-client');
      const socket = io(API_URL, { auth: { token: user?.token }, transports: ['websocket'] });
      socketRef.current = socket;

      socket.on('connect', () => {
        if (postId) {
          socket.emit('join', { postId });
        }
        setTimeout(() => createOffer(), 100);
      });

      socket.on('incoming-call', async (data: any) => {
        if (data && data.offer) {
          await handleOffer(data.offer);
        }
      });

      socket.on('call-accepted', (data: any) => {
        if (data && data.answer) {
          handleAnswer(data.answer);
        }
      });

      socket.on('call-rejected', () => {
        Alert.alert('Call Rejected', 'The other user rejected your call');
        endCall();
      });

      socket.on('ice-candidate', async (data: any) => {
        if (data && data.candidate) {
          await handleIceCandidate(data.candidate);
        }
      });

      socket.on('disconnect', () => {
        console.log('signaling disconnected');
      });
    } catch (err) {
      Alert.alert('WebRTC Setup', 'Failed to connect to signaling server');
    }
  };

  const createOffer = async () => {
    if (!peerConnectionRef.current) return;

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);

      if (socketRef.current && user?.id) {
        socketRef.current.emit('call-user', { to: otherUserId, offer, postId: postId || 'direct' });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to create offer');
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);

      if (socketRef.current) {
        socketRef.current.emit('call-accepted', { to: otherUserId, answer });
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to handle offer');
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err: any) {
      Alert.alert('Error', 'Failed to handle answer');
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) return;

    try {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err: any) {
      console.error('Failed to add ICE candidate:', err);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track: MediaStreamTrack) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track: MediaStreamTrack) => {
        track.stop();
      });
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setCallStatus('ended');
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerText}>
          {callStatus === 'calling' && 'Calling...'}
          {callStatus === 'ringing' && 'Ringing...'}
          {callStatus === 'connected' && 'Connected'}
          {callStatus === 'idle' && 'Video Call'}
        </ThemedText>
        <ThemedText style={styles.userName}>{otherUserName}</ThemedText>
      </View>

      <View style={styles.videoContainer}>
        {/* Remote video */}
        <View style={styles.remoteVideoContainer}>
          {callStatus === 'connected' ? (
            Platform.OS === 'web' ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={styles.remoteVideo}
              />
            ) : (
              <View style={styles.placeholder}>
                <MaterialIcons name="videocam" size={64} color="#999" />
                <ThemedText style={styles.placeholderText}>Video stream active</ThemedText>
              </View>
            )
          ) : (
            <View style={styles.placeholder}>
              <MaterialIcons name="videocam" size={64} color="#999" />
              <ThemedText style={styles.placeholderText}>
                {callStatus === 'calling' && 'Waiting for answer...'}
                {callStatus === 'ringing' && 'Ringing...'}
                {callStatus === 'idle' && 'Connecting...'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Local video */}
        <View style={styles.localVideoContainer}>
          {Platform.OS === 'web' ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={styles.localVideo}
            />
          ) : (
            <View style={styles.localVideoPlaceholder}>
              <MaterialIcons name="videocam" size={32} color="#fff" />
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <Pressable
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <MaterialIcons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
        </Pressable>

        <Pressable
          style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
          onPress={toggleVideo}
        >
          <MaterialIcons name={isVideoOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
        </Pressable>

        <Pressable
          style={[styles.controlButton, styles.endCallButton]}
          onPress={endCall}
        >
          <MaterialIcons name="call-end" size={24} color="#fff" />
        </Pressable>
      </View>
    </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  headerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    color: '#999',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideoContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  remoteVideo: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    marginTop: 16,
    color: '#999',
    fontSize: 14,
  },
  localVideoContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  localVideoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonActive: {
    backgroundColor: brandYellowDark,
  },
  endCallButton: {
    backgroundColor: brandYellowDark,
  },
});

