import {
    MaterialCommunityIcons,
  } from '@expo/vector-icons';
  
  
  import {
    router,
  } from 'expo-router';
  
  
  import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
  } from 'react-native';
  
  
  import {
    COLORS,
  } from '../constants/colors';
  
  
  interface Props {
  
    title:
      string;
  
    subtitle?:
      string;
  
    rightIcon?:
      keyof typeof
        MaterialCommunityIcons.glyphMap;
  
    onRightPress?:
      () => void;
  
  }
  
  
  export default function ScreenHeader({
  
    title,
  
    subtitle,
  
    rightIcon,
  
    onRightPress,
  
  }: Props) {
  
    return (
  
      <View
        style={
          styles.container
        }
      >
  
        <TouchableOpacity
          style={
            styles.button
          }
          onPress={() =>
            router.back()
          }
        >
  
          <MaterialCommunityIcons
            name="chevron-left"
            size={32}
            color={
              COLORS.white
            }
          />
  
        </TouchableOpacity>
  
  
        <View
          style={
            styles.textArea
          }
        >
  
          <Text
            style={
              styles.title
            }
            numberOfLines={1}
          >
            {title}
          </Text>
  
  
          {subtitle ? (
  
            <Text
              style={
                styles.subtitle
              }
              numberOfLines={1}
            >
              {subtitle}
            </Text>
  
          ) : null}
  
        </View>
  
  
        {rightIcon &&
        onRightPress ? (
  
          <TouchableOpacity
            style={
              styles.button
            }
            onPress={
              onRightPress
            }
          >
  
            <MaterialCommunityIcons
              name={
                rightIcon
              }
              size={23}
              color={
                COLORS.white
              }
            />
  
          </TouchableOpacity>
  
        ) : (
  
          <View
            style={
              styles.button
            }
          />
  
        )}
  
      </View>
    );
  }
  
  
  const styles =
    StyleSheet.create({
  
      container: {
  
        flexDirection:
          'row',
  
        alignItems:
          'center',
  
        paddingHorizontal:
          10,
  
        paddingVertical:
          8,
  
      },
  
  
      button: {
  
        width:
          46,
  
        height:
          46,
  
        justifyContent:
          'center',
  
        alignItems:
          'center',
  
      },
  
  
      textArea: {
  
        flex:
          1,
  
      },
  
  
      title: {
  
        color:
          COLORS.white,
  
        fontSize:
          23,
  
        fontWeight:
          '700',
  
      },
  
  
      subtitle: {
  
        color:
          COLORS.textMuted,
  
        fontSize:
          11,
  
        marginTop:
          2,
  
      },
  
    });