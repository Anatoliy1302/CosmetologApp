import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { formatTemplate } from '../../config/constants';
import { TEMPLATE_VARIABLES } from '../../config/templates';
import { COLORS } from '../../config/colors';
import { commonStyles } from '../../theme/commonStyles';

const PREVIEW_SAMPLE = {
  clientName: 'Анна',
  service: 'Чистка лица',
  date: '8 Июля 2026',
  time: '14:00',
  price: '3500',
  address: 'Владивосток, ул. Некрасовская 48А',
};

export const TemplateEditor = ({ icon, title, when, text, onChangeText, onInsert }) => {
  const preview = formatTemplate(text || '', PREVIEW_SAMPLE);

  return (
    <View style={cardStyle}>
      <View style={headerRow}>
        <Text style={{ fontSize: 28, marginRight: 12 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={titleStyle}>{title}</Text>
          <Text style={whenStyle}>{when}</Text>
        </View>
      </View>
      <Text style={commonStyles.label}>Как увидит клиент (пример):</Text>
      <View style={previewBox}>
        <Text style={previewText}>{preview.trim() || 'Напишите текст ниже — здесь появится пример'}</Text>
      </View>
      <Text style={commonStyles.label}>Ваш текст сообщения:</Text>
      <TextInput
        style={[commonStyles.input, commonStyles.textArea, { minHeight: 130 }]}
        value={text}
        onChangeText={onChangeText}
        multiline
        numberOfLines={7}
        placeholderTextColor={COLORS.textLight}
        placeholder="Напишите текст..."
      />
      <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 14, marginBottom: 8 }}>Нажмите, чтобы вставить:</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {TEMPLATE_VARIABLES.map((v) => (
          <TouchableOpacity key={v.key} style={insertBtn} onPress={() => onInsert(v.key)}>
            <Text style={insertBtnText}>+ {v.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const cardStyle = { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border };
const headerRow = { flexDirection: 'row', marginBottom: 14 };
const titleStyle = { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary };
const whenStyle = { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 18 };
const previewBox = { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: COLORS.success };
const previewText = { fontSize: 14, color: COLORS.textPrimary, lineHeight: 21 };
const insertBtn = { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8 };
const insertBtnText = { fontSize: 13, color: COLORS.textOnPrimary, fontWeight: '600' };
