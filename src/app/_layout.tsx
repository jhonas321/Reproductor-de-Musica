import {
  Stack,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

import {
  AppProvider,
} from '../context/AppContext';

import GlobalPlayer
  from '../components/GlobalPlayer';


export default function RootLayout() {
  return (
    <GestureHandlerRootView
      style={{
        flex:
          1,
      }}
    >
      <AppProvider>
        <StatusBar
          style=
            "light"
        />


        <Stack
          screenOptions={{
            headerShown:
              false,

            contentStyle: {
              backgroundColor:
                '#0D0D12',
            },

            animation:
              'slide_from_right',
          }}
        >
          <Stack.Screen
            name=
              "index"
          />

          <Stack.Screen
            name=
              "albums"
          />

          <Stack.Screen
            name=
              "album"
          />

          <Stack.Screen
            name=
              "artists"
          />

          <Stack.Screen
            name=
              "artist"
          />

          <Stack.Screen
            name=
              "folders"
          />

          <Stack.Screen
            name=
              "folder"
          />

          <Stack.Screen
            name=
              "playlists"
          />

          <Stack.Screen
            name=
              "playlist"
          />

          <Stack.Screen
            name=
              "recent"
          />

          <Stack.Screen
            name=
              "top"
          />

          <Stack.Screen
            name=
              "queue"
          />

          <Stack.Screen
            name=
              "settings"
          />
        </Stack>


        <GlobalPlayer />
      </AppProvider>
    </GestureHandlerRootView>
  );
}
