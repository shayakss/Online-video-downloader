import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sparkles, Star, Heart, ThumbsUp, Flame, Zap, Music, Video, Download } from 'lucide-react';

const StickerLibrary = ({ onStickerSelect, isVisible, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('emoji');

  const stickerCategories = {
    emoji: {
      label: '🎭 Emoji',
      stickers: ['😍', '🔥', '💯', '🚀', '✨', '💫', '🌟', '💎', '👑', '🎉', '🎊', '🎈', '🎁', '❤️', '💖', '💝', '👍', '👏', '🙌', '✌️']
    },
    neon: {
      label: '⚡ Neon',
      stickers: [
        { type: 'icon', component: Sparkles, color: 'text-cyan-400', label: 'Sparkles' },
        { type: 'icon', component: Star, color: 'text-yellow-400', label: 'Star' },
        { type: 'icon', component: Heart, color: 'text-pink-400', label: 'Heart' },
        { type: 'icon', component: ThumbsUp, color: 'text-green-400', label: 'Like' },
        { type: 'icon', component: Flame, color: 'text-red-400', label: 'Fire' },
        { type: 'icon', component: Zap, color: 'text-purple-400', label: 'Zap' }
      ]
    },
    social: {
      label: '📱 Social',
      stickers: ['#VIRAL', '#TRENDING', '#EPIC', '#MOOD', '#VIBES', '#BLESSED', '#GOALS', '#FLEX', '#FIRE', '#LIT']
    },
    reactions: {
      label: '😮 Reactions',
      stickers: ['OMG!', 'WOW!', 'AMAZING!', 'COOL!', 'AWESOME!', 'INSANE!', 'PERFECT!', 'LOVE IT!', 'YASSS!', 'SLAY!']
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="glass-card w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="border-b border-cyan-400/20">
          <div className="flex items-center justify-between">
            <CardTitle className="neon-text text-xl flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Sticker Library
            </CardTitle>
            <Button variant="ghost" onClick={onClose} className="text-gray-400 hover:text-white">
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Category Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {Object.keys(stickerCategories).map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={selectedCategory === category ? "btn-neon" : "text-gray-400"}
              >
                {stickerCategories[category].label}
              </Button>
            ))}
          </div>

          {/* Sticker Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-3 max-h-96 overflow-y-auto">
            {stickerCategories[selectedCategory].stickers.map((sticker, index) => (
              <div
                key={index}
                onClick={() => onStickerSelect(sticker)}
                className="aspect-square flex items-center justify-center p-2 rounded-lg glass-effect hover:scale-110 cursor-pointer transition-all duration-200 hover:shadow-neon-md"
              >
                {typeof sticker === 'string' ? (
                  <span className="text-2xl">{sticker}</span>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <sticker.component className={`w-6 h-6 ${sticker.color}`} />
                    <span className="text-xs text-gray-400">{sticker.label}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Custom Text Sticker */}
          <div className="mt-6 pt-4 border-t border-cyan-400/20">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Create custom sticker..."
                className="input-professional flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    onStickerSelect(e.target.value.trim());
                    e.target.value = '';
                  }
                }}
              />
              <Button 
                className="btn-neon"
                onClick={(e) => {
                  const input = e.target.parentNode.querySelector('input');
                  if (input.value.trim()) {
                    onStickerSelect(input.value.trim());
                    input.value = '';
                  }
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StickerLibrary;