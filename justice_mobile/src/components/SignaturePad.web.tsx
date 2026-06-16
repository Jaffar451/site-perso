import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onOK: (signature: string) => void;
  description: string;
  penColor?: string;
  backgroundColor?: string;
  clearText?: string;
  confirmText?: string;
}

export const SignaturePad = ({
  onOK,
  description,
  penColor = '#1A237E',
  backgroundColor = '#FFFFFF',
  clearText = 'Effacer le tracé',
  confirmText = 'Confirmer la signature',
}: Props) => {
  const canvasRef = useRef<any>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth || 600;
    canvas.height = canvas.offsetHeight || 250;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [backgroundColor]);

  const getPos = (e: any) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    if (e.touches) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: any) => {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  };

  const draw = (e: any) => {
    if (!isDrawing || !lastPos.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
    setHasContent(true);
  };

  const stopDraw = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
  };

  const confirm = () => {
    if (!hasContent) return;
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/png');
    onOK(dataUrl);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: '#64748B' }]}>{description}</Text>

      <View style={[styles.padContainer, { borderColor: penColor + '40' }]}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair', borderRadius: 18 } as any}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
        {!hasContent && (
          <View style={styles.placeholder} pointerEvents="none">
            <Text style={styles.placeholderText}>Signez ici avec votre souris ou doigt</Text>
          </View>
        )}
      </View>

      <View style={styles.row}>
        <TouchableOpacity style={styles.btnReset} onPress={clear} activeOpacity={0.7}>
          <Text style={styles.resetText}>{clearText}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.btnSave, { backgroundColor: hasContent ? penColor : '#CBD5E1' }]}
          onPress={confirm}
          activeOpacity={0.85}
          disabled={!hasContent}
        >
          <Text style={styles.saveText}>{confirmText.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container:       { width: '100%', height: 380, marginVertical: 15 },
  label:           { fontSize: 12, fontWeight: '800', marginBottom: 10, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 },
  padContainer:    { flex: 1, borderWidth: 2, borderRadius: 20, overflow: 'hidden', borderStyle: 'dashed', backgroundColor: '#FFF', position: 'relative' },
  placeholder:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#CBD5E1', fontSize: 14, fontStyle: 'italic' },
  row:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, gap: 10 },
  btnReset:        { paddingVertical: 14, flex: 1, alignItems: 'center' },
  resetText:       { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  btnSave:         { paddingVertical: 16, borderRadius: 14, flex: 1.5, alignItems: 'center' },
  saveText:        { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
});
