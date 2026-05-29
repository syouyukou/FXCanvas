




uniform int d_texture;          // ui=texture, label="Texture", channel=2, default=Custom/paint-chips-texture-tile.jpg
uniform int fit; // ui=switcher, label=Fit type, options=[Fill:0|Stretch:1|Tile:2], value=2
uniform float textureScale;   // label=texture scale, value=1.4, min=1.0, max=5.0, step=0.01, desc=zoom (mode 0) or tile repetitions (mode 2)
uniform int blendChannel;        // ui=dropdown, label="Blend channel", options=[Gray:0|Red:1|Green:2|Blue:3], value=0
uniform float d_current_curve;   // ui=ramp-curve, channel=5, label="Current layer ramp"
uniform float d_underlying_curve; // ui=ramp-curve, channel=6, label="Underlying layer ramp"
uniform float opacity;           // value=1.0, min=0.0, max=1.0, step=0.01, desc=layer opacity
uniform int blendMode;           // ui=dropdown, label="Blend mode", options=[Normal:0|Multiply:1|Screen:2|Overlay:3|Soft light:4|Hard light:5|Color dodge:6|Hard mix:7], value=1

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

ivec2 wrapTexelCoord(vec2 coord, vec2 size) {
    return ivec2(mod(coord, size));
}

vec4 sampleTiledTexture(sampler2D tex, vec2 uv) {
    vec2 texSize = vec2(textureSize(tex, 0));
    vec2 texelPos = fract(uv) * texSize - 0.5;

    vec2 base = floor(texelPos);
    vec2 f = fract(texelPos);

    ivec2 p00 = wrapTexelCoord(base, texSize);
    ivec2 p10 = wrapTexelCoord(base + vec2(1.0, 0.0), texSize);
    ivec2 p01 = wrapTexelCoord(base + vec2(0.0, 1.0), texSize);
    ivec2 p11 = wrapTexelCoord(base + vec2(1.0, 1.0), texSize);

    vec4 c00 = texelFetch(tex, p00, 0);
    vec4 c10 = texelFetch(tex, p10, 0);
    vec4 c01 = texelFetch(tex, p01, 0);
    vec4 c11 = texelFetch(tex, p11, 0);

    vec4 cx0 = mix(c00, c10, f.x);
    vec4 cx1 = mix(c01, c11, f.x);
    return mix(cx0, cx1, f.y);
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

float applyCurrentCurve(float v) {
    return texture(iChannel5, vec2(clamp(v, 0.0, 1.0), 0.5)).a;
}

float applyUnderlyingCurve(float v) {
    return texture(iChannel6, vec2(clamp(v, 0.0, 1.0), 0.5)).a;
}

float calculateBlendMask(vec3 currentColor, vec3 underlyingColor, int channel) {
    float currentValue = getChannelValue(currentColor, channel);
    float underlyingValue = getChannelValue(underlyingColor, channel);

    float currentMask = applyCurrentCurve(currentValue);
    float underlyingMask = applyUnderlyingCurve(underlyingValue);
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

vec3 colorBurnBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r <= 0.0) ? 0.0 : max(1.0 - (1.0 - base.r) / blend.r, 0.0),
        (blend.g <= 0.0) ? 0.0 : max(1.0 - (1.0 - base.g) / blend.g, 0.0),
        (blend.b <= 0.0) ? 0.0 : max(1.0 - (1.0 - base.b) / blend.b, 0.0)
    );
}

vec3 vividLightBlend(vec3 base, vec3 blend) {
    return vec3(
        (blend.r < 0.5) ? colorBurnBlend(vec3(base.r), vec3(2.0 * blend.r)).r : colorDodgeBlend(vec3(base.r), vec3(2.0 * (blend.r - 0.5))).r,
        (blend.g < 0.5) ? colorBurnBlend(vec3(base.g), vec3(2.0 * blend.g)).g : colorDodgeBlend(vec3(base.g), vec3(2.0 * (blend.g - 0.5))).g,
        (blend.b < 0.5) ? colorBurnBlend(vec3(base.b), vec3(2.0 * blend.b)).b : colorDodgeBlend(vec3(base.b), vec3(2.0 * (blend.b - 0.5))).b
    );
}

vec3 hardMixBlend(vec3 base, vec3 blend) {
    vec3 vivid = vividLightBlend(base, blend);
    return step(vec3(0.5), vivid);
}

vec3 applyBlendMode(vec3 base, vec3 blend, int mode) {
    if (mode == 0) return normalBlend(base, blend);
    if (mode == 1) return multiplyBlend(base, blend);
    if (mode == 2) return screenBlend(base, blend);
    if (mode == 3) return overlayBlend(base, blend);
    if (mode == 4) return softLightBlend(base, blend);
    if (mode == 5) return hardLightBlend(base, blend);
    if (mode == 6) return colorDodgeBlend(base, blend);
    if (mode == 7) return hardMixBlend(base, blend);
    return normalBlend(base, blend);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 baseColor = texture(iChannel0, uv);

    vec2 textureUV = calculateTextureUV(uv, fit, textureScale);
    vec4 layerColor = (fit == 2)
        ? sampleTiledTexture(iChannel2, textureUV)
        : texture(iChannel2, clamp(textureUV, 0.0, 1.0));

    float blendMask = calculateBlendMask(layerColor.rgb, baseColor.rgb, blendChannel);
    vec3 blendedColor = applyBlendMode(baseColor.rgb, layerColor.rgb, blendMode);
    float finalOpacity = opacity * layerColor.a * blendMask;

    vec3 finalColor = mix(baseColor.rgb, blendedColor, finalOpacity);
    fragColor = vec4(finalColor, baseColor.a);
}
