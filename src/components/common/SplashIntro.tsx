import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useData } from '../../context/DataContext';

const SPLASH_BACKGROUND = '#240F00';
const SPLASH_VIDEO = require('../../../assets/penny-splash.mp4');
const SPLASH_POSTER = require('../../../assets/penny-splash-poster.png');

export function SplashIntro({ onComplete }: { onComplete?: () => void }) {
  const { isLoading } = useData();
  const [videoFinished, setVideoFinished] = useState(false);
  const player = useVideoPlayer(SPLASH_VIDEO, (videoPlayer) => {
    videoPlayer.loop = false;
    videoPlayer.muted = true;
    videoPlayer.play();
  });

  useEffect(() => {
    const endSubscription = player.addListener('playToEnd', () => setVideoFinished(true));
    const errorSubscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') setVideoFinished(true);
    });
    // A decoder failure must never leave the app covered by the intro.
    const fallback = setTimeout(() => setVideoFinished(true), 7000);

    return () => {
      endSubscription.remove();
      errorSubscription.remove();
      clearTimeout(fallback);
    };
  }, [player]);

  useEffect(() => {
    if (videoFinished && !isLoading) onComplete?.();
  }, [videoFinished, isLoading, onComplete]);

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <StatusBar hidden />
      {videoFinished ? (
        <Image source={SPLASH_POSTER} style={styles.media} resizeMode="contain" />
      ) : (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="contain"
          nativeControls={false}
          allowsPictureInPicture={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
  },
  media: {
    width: '100%',
    height: '100%',
  },
});
