import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/AppThemeProvider';
import ScreenContainer from '../../components/layout/ScreenContainer';
import AppHeader from '../../components/layout/AppHeader';
import { SignaturePad } from '../../components/SignaturePad';

interface Props {
  navigation: any;
  route: {
    params: {
      onSave: (signatureBase64: string) => void;
      title?: string;
    };
  };
}

export default function SignatureCaptureScreen({ navigation, route }: Props) {
  const { theme } = useAppTheme();
  const { onSave, title = 'Signature du déclarant' } = route.params;

  const handleOK = (signature: string) => {
    onSave(signature);
    navigation.goBack();
  };

  return (
    <ScreenContainer>
      <AppHeader title={title} showBack />
      <View style={styles.content}>
        <SignaturePad
          onOK={handleOK}
          description={title}
          penColor={theme.colors.primary}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 20 },
});
