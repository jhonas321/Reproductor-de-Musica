import TrackPlayer, {
    PlayerCommand,
  } from '@rntp/player';
  
  let initialized = false;
  
  export async function setupTrackPlayer() {
    if (initialized) {
      return;
    }
  
    TrackPlayer.setupPlayer({
      contentType: 'music',
  
      handleAudioBecomingNoisy:
        true,
  
      android: {
        wakeMode:
          'local',
  
        taskRemovedBehavior:
          'continue',
      },
    });
  
    TrackPlayer.setCommands({
      capabilities: [
        PlayerCommand.PlayPause,
        PlayerCommand.Next,
        PlayerCommand.Previous,
        PlayerCommand.Seek,
      ],
  
      handling:
        'native',
    });
  
    initialized =
      true;
  }