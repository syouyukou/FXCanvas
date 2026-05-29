




uniform int d_texture;          // ui=texture, label="Texture", channel=2, default=Custom/paint-chips-texture.jpg
uniform int fit; // ui=switcher, label=Fit type, options=[Fill:0|Stretch:1|Tile:2]
uniform float textureScale;   // label=texture scale, value=1.0, min=1.0, max=5.0, step=0.01, desc=zoom (mode 0) or tile repetitions (mode 2)
uniform int blendChannel;        // value=0, min=0, max=3, step=1, desc=blend if channel: 0=gray, 1=red, 2=green, 3=blue
uniform float currentLayerMin;   // value=0.0, min=0.0, max=1.0, step=0.01, desc=current layer min threshold
uniform float currentLayerMax;   // value=0.72, min=0.0, max=1.0, step=0.01, desc=current layer max threshold
uniform float currentMinShoulder; // value=0.0, min=0.0, max=0.2, step=0.01, desc=current layer min shoulder (soft transition)
uniform float currentMaxShoulder; // value=0.0, min=0.0, max=0.2, step=0.01, desc=current layer max shoulder (soft transition)
uniform float underlyingMin;     // value=0.0, min=0.0, max=1.0, step=0.01, desc=underlying layer min threshold
uniform float underlyingMax;     // value=1.0, min=0.0, max=1.0, step=0.01, desc=underlying layer max threshold
uniform float underlyingMinShoulder; // value=0.2, min=0.0, max=0.2, step=0.01, desc=underlying layer min shoulder (soft transition)
uniform float underlyingMaxShoulder; // value=0.0, min=0.0, max=0.2, step=0.01, desc=underlying layer max shoulder (soft transition)
uniform float opacity;           // value=1.0, min=0.0, max=1.0, step=0.01, desc=layer opacity
uniform int blendMode;           // value=1, min=0, max=6, step=1, desc=blend mode: 0=normal, 1=multiply, 2=screen, 3=overlay, 4=soft light, 5=hard light, 6=color dodge


vec2 calculateTextureUV(vec2 uv, int mode, float scale) {
    if (mode == 0) {
        
        float canvasAspect = iResolution.x / iResolution.y;
        vec2 texSize = vec2(textureSize(iChannel2, 0));
        float textureAspect = texSize.x / texSize.y;

        
        vec2 adjustedUV = uv;
        if (canvasAspect > textureAspect) {
            
            
            float heightScale = canvasAspect / textureAspect;
            adjustedUV.y = (uv.y - 0.5) / heightScale + 0.5;
        } else {
            
            
            float widthScale = textureAspect / canvasAspect;
            adjustedUV.x = (uv.x - 0.5) / widthScale + 0.5;
        }

        
        vec2 scaledUV = (adjustedUV - 0.5) / scale + 0.5;
        return scaledUV;

    } else if (mode == 1) {
        
        return uv;

    } else {
        
        
        float canvasAspect = iResolution.x / iResolution.y;
        vec2 texSize = vec2(textureSize(iChannel2, 0));
        float textureAspect = texSize.x / texSize.y;

        
        vec2 adjustedUV = uv;
        if (canvasAspect > textureAspect) {
            
            adjustedUV.x = uv.x * (canvasAspect / textureAspect);
        } else {
            
            adjustedUV.y = uv.y * (textureAspect / canvasAspect);
        }

        
        vec2 tiledUV = adjustedUV * scale;
        return tiledUV;
    }
}


float getChannelValue(vec3 color, int channel) {
    if (channel == 0) {
        
        return dot(color, vec3(0.299, 0.587, 0.114));
    } else if (channel == 1) {
        return color.r; 
    } else if (channel == 2) {
        return color.g; 
    } else {
        return color.b; 
    }
}


float calculateBlendIfMask(vec3 currentColor, vec3 underlyingColor, int channel,
                          float currentMin, float currentMax, float currentMinShoulder, float currentMaxShoulder,
                          float underlyingMin, float underlyingMax, float underlyingMinShoulder, float underlyingMaxShoulder) {

    
    float currentValue = getChannelValue(currentColor, channel);
    float underlyingValue = getChannelValue(underlyingColor, channel);

    
    float currentMask = 1.0;
    if (currentMin > 0.0 || currentMax < 1.0) {
        
        float minTransition = max(currentMinShoulder, 0.01);
        float maxTransition = max(currentMaxShoulder, 0.01);

        
        float minMask = smoothstep(currentMin - minTransition, currentMin + minTransition, currentValue);
        float maxMask = 1.0 - smoothstep(currentMax - maxTransition, currentMax + maxTransition, currentValue);

        currentMask = minMask * maxMask;
    }

    
    float underlyingMask = 1.0;
    if (underlyingMin > 0.0 || underlyingMax < 1.0) {
        float minTransition = max(underlyingMinShoulder, 0.01);
        float maxTransition = max(underlyingMaxShoulder, 0.01);

        float minMask = smoothstep(underlyingMin - minTransition, underlyingMin + minTransition, underlyingValue);
        float maxMask = 1.0 - smoothstep(underlyingMax - maxTransition, underlyingMax + maxTransition, underlyingValue);

        underlyingMask = minMask * maxMask;
    }

    
    return currentMask * underlyingMask;
}


vec3 normalBlend(vec3 base, vec3 blend) {
    return blend;
}

vec3 multiplyBlend(vec3 base, vec3 blend) {
    return base * blend;
}

vec3 screenBlend(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

vec3 overlayBlend(vec3 base, vec3 blend) {
    return vec3(
        (base.r < 0.5) ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
        (base.g < 0.5) ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
        (base.b < 0.5) ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
    );
}

vec3 softLightBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r < 0.5) ? (2.0 * base.r * blend.r + base.r * base.r * (1.0 - 2.0 * blend.r)) :
                         (sqrt(base.r) * (2.0 * blend.r - 1.0) + 2.0 * base.r * (1.0 - blend.r)),
        (blend.g < 0.5) ? (2.0 * base.g * blend.g + base.g * base.g * (1.0 - 2.0 * blend.g)) :
                         (sqrt(base.g) * (2.0 * blend.g - 1.0) + 2.0 * base.g * (1.0 - blend.g)),
        (blend.b < 0.5) ? (2.0 * base.b * blend.b + base.b * base.b * (1.0 - 2.0 * blend.b)) :
                         (sqrt(base.b) * (2.0 * blend.b - 1.0) + 2.0 * base.b * (1.0 - blend.b))
    );
}

vec3 hardLightBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r < 0.5) ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
        (blend.g < 0.5) ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
        (blend.b < 0.5) ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
    );
}

vec3 colorDodgeBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r >= 1.0) ? 1.0 : min(base.r / (1.0 - blend.r), 1.0),
        (blend.g >= 1.0) ? 1.0 : min(base.g / (1.0 - blend.g), 1.0),
        (blend.b >= 1.0) ? 1.0 : min(base.b / (1.0 - blend.b), 1.0)
    );
}

vec3 applyBlendMode(vec3 base, vec3 blend, int mode) {
    if (mode == 0) return normalBlend(base, blend);
    if (mode == 1) return multiplyBlend(base, blend);
    if (mode == 2) return screenBlend(base, blend);
    if (mode == 3) return overlayBlend(base, blend);
    if (mode == 4) return softLightBlend(base, blend);
    if (mode == 5) return hardLightBlend(base, blend);
    if (mode == 6) return colorDodgeBlend(base, blend);
    return normalBlend(base, blend); 
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec2 uv = fragCoord.xy / iResolution.xy;

    
    vec4 baseColor = texture(iChannel0, uv);

    
    vec2 textureUV = calculateTextureUV(uv, fit, textureScale);
    
    vec2 sampleUV = (fit == 2) ? fract(textureUV) : clamp(textureUV, 0.0, 1.0);
    vec4 layerColor = texture(iChannel2, sampleUV);

    
    float blendIfMask = calculateBlendIfMask(layerColor.rgb, baseColor.rgb, blendChannel,
                                           currentLayerMin, currentLayerMax, currentMinShoulder, currentMaxShoulder,
                                           underlyingMin, underlyingMax, underlyingMinShoulder, underlyingMaxShoulder);

    
    vec3 blendedColor = applyBlendMode(baseColor.rgb, layerColor.rgb, blendMode);

    
    float finalOpacity = opacity * layerColor.a * blendIfMask;

    
    vec3 finalColor = mix(baseColor.rgb, blendedColor, finalOpacity);

    
    fragColor = vec4(finalColor, baseColor.a);
}
