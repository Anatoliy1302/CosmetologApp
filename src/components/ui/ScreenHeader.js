import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { commonStyles } from '../../theme/commonStyles';

export const ScreenHeader = ({
  title,
  onBack,
  backLabel = '←',
  rightAction,
  style,
  titleStyle,
  backStyle = 'arrow',
}) => (
  <View style={[commonStyles.header, style]}>
    <TouchableOpacity onPress={onBack} style={commonStyles.backBtn}>
      <Text style={backStyle === 'text' ? commonStyles.backBtnTextSmall : commonStyles.backBtnText}>
        {backLabel}
      </Text>
    </TouchableOpacity>
    <Text style={[commonStyles.headerTitle, titleStyle]} numberOfLines={1}>{title}</Text>
    <View style={commonStyles.headerRight}>{rightAction || null}</View>
  </View>
);
