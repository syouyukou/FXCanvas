// @feedback channel=2







uniform float amount;      // label=spread, value=5.0, min=0.0, max=30.0, step=0.5
uniform float decay;       // label=decay, value=0.0, min=0.0, max=0.2, step=0.001
uniform float intensity;   // label=intensity, value=0.15, min=0.0, max=1.0, step=0.01
uniform vec2  spreadDir;   // label=direction, value=(0.0, 0.0), min=-1.0, max=1.0, step=0.001, desc=directional bias for ink flow (added to noise)
uniform float noiseSize;   // label=noise size, value=90.0, min=4.0, max=120.0, step=1.0
uniform float grainAmount;  // label=grain, value=0.4, min=0.0, max=1.0, step=0.01
uniform float grainSize;    // label=grain size, value=1.0, min=0.5, max=3.0, step=0.1
uniform int d_maskTexture;  // ui=texture, label="custom mask", channel=3
uniform float d_curve;     // ui=curve, label="mask contrast"
uniform float maskStrength; // label=mask strength, value=1.0, min=0.0, max=1.0, step=0.01
uniform int showMask;       // ui=switch, label=show mask, value=0, off=0, on=1, random=0
uniform float flushTimerSec; // label=Ink reset (sec), value=0.0, min=0.0, max=10.0, step=1.0, unit=s, desc=0 disables auto flush




float hash12(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash12(i + vec2(0.0, 0.0));
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise2(p);
        p *= 2.0;
        a *= 0.5;
    }
    return v;
}



float grainHash(vec2 p) {
    const uint k = 1103515245u;
    uvec2 x = uvec2(floatBitsToUint(p.x), floatBitsToUint(p.y));
    x = ((x >> 8u) ^ x.yx) * k;
    x = ((x >> 8u) ^ x.yx) * k;
    return uintBitsToFloat((x.x & 0x007FFFFFu) | 0x3F800000u) - 1.0;
}

float grainNoise(vec2 px, float cell) {
    vec2 g = px / cell;
    vec2 i = floor(g), f = fract(g);
    float n00 = grainHash(i);
    float n10 = grainHash(i + vec2(1.0, 0.0));
    float n01 = grainHash(i + vec2(0.0, 1.0));
    float n11 = grainHash(i + vec2(1.0, 1.0));
    return mix(mix(n00, n10, f.x), mix(n01, n11, f.x), f.y);
}



vec3 srgbToLinear(vec3 c) { return pow(max(c, vec3(0.0)), vec3(2.2)); }
vec3 linearToSrgb(vec3 c) { return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }



vec4 sampleCurves(float x) {
    return texture(iChannel5, vec2(clamp(x, 0.0, 1.0), 0.5));
}

float applyMasterCurve(float v) {
    if (d_curve > 0.5) return v;
    return sampleCurves(v).a;
}



vec2 mirrorWrap(vec2 uv) {
    uv = abs(uv);
    uv = uv - 2.0 * floor(uv * 0.5);
    return vec2(uv.x > 1.0 ? 2.0 - uv.x : uv.x,
                uv.y > 1.0 ? 2.0 - uv.y : uv.y);
}

vec4 sampleSource(vec2 uv) {
    vec4 s = texture(iChannel0, mirrorWrap(uv));
    return vec4(srgbToLinear(s.rgb), s.a);
}

vec3 sampleFb(vec2 uv) {
    return srgbToLinear(texture(iChannel2, mirrorWrap(uv)).rgb);
}

float sampleFbAlpha(vec2 uv) {
    return texture(iChannel2, mirrorWrap(uv)).a;
}


vec2 coverMaskUV(vec2 uv) {
    float canvasAspect = iResolution.x / iResolution.y;
    vec2 texSize = vec2(textureSize(iChannel3, 0));
    float textureAspect = texSize.x / texSize.y;

    vec2 adjustedUV = uv;
    if (canvasAspect > textureAspect) {
        float heightScale = canvasAspect / textureAspect;
        adjustedUV.y = (uv.y - 0.5) / heightScale + 0.5;
    } else {
        float widthScale = textureAspect / canvasAspect;
        adjustedUV.x = (uv.x - 0.5) / widthScale + 0.5;
    }

    return clamp(adjustedUV, 0.0, 1.0);
}

float sampleMask(vec2 uv) {
    vec2 mappedUV = coverMaskUV(uv);
    return dot(texture(iChannel3, mappedUV).rgb, vec3(0.299, 0.587, 0.114));
}



void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 source = sampleSource(uv);         
    float fbAlpha = sampleFbAlpha(uv);

    
    float cell = max(grainSize, 0.5);
    float g1 = grainNoise(fragCoord, cell) * 2.0 - 1.0;
    float g2 = grainNoise(fragCoord + vec2(57.3, 113.7), cell) * 2.0 - 1.0;

    
    float rawMask = sampleMask(uv);
    float mask = mix(1.0, applyMasterCurve(rawMask), maskStrength);

    
    if (showMask == 1) {
        fragColor = vec4(vec3(mask), 1.0);
        return;
    }

    
    bool autoFlushEnabled = flushTimerSec > 0.0;
    int flushPeriodFrames = max(1, int(round(flushTimerSec * 60.0)));
    bool shouldFlush = autoFlushEnabled && (iFrame > 0) && (iFrame % flushPeriodFrames == 0);
    if (fbAlpha < 0.01 || shouldFlush) {
        fragColor = vec4(linearToSrgb(source.rgb), source.a);
        return;
    }

    vec3 fb = sampleFb(uv);                 

    
    float fbLuma = dot(fb, vec3(0.2126, 0.7152, 0.0722));
    vec2 fbJitter = vec2(fbLuma, fbLuma * 1.37);
    float nj1 = fbm(uv * noiseSize + fbJitter * 3.0);
    float nj2 = fbm(uv * noiseSize + vec2(11.7, 7.3) + fbJitter * 5.0);
    nj1 = clamp(nj1 + g1 * grainAmount, 0.0, 1.0);
    nj2 = clamp(nj2 + g2 * grainAmount, 0.0, 1.0);

    vec2 noiseVec = vec2(nj1, nj2) * 2.0 - 1.0;

    vec2 texel = 1.0 / iResolution.xy;
    vec2 baseOffset = (noiseVec - spreadDir) * amount * mask * texel;

    
    vec2 offX = vec2(amount * mask * texel.x, 0.0);
    vec2 offY = vec2(0.0, amount * mask * texel.y);

    vec3 fbC = sampleFb(uv + baseOffset);
    vec3 fbR = sampleFb(uv + baseOffset + offX);
    vec3 fbL = sampleFb(uv + baseOffset - offX);
    vec3 fbU = sampleFb(uv + baseOffset + offY);
    vec3 fbD = sampleFb(uv + baseOffset - offY);

    
    const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
    vec3 spreadMin = fbC;
    float spreadLuma = dot(spreadMin, LW);
    float lR = dot(fbR, LW); if (lR < spreadLuma) { spreadMin = fbR; spreadLuma = lR; }
    float lL = dot(fbL, LW); if (lL < spreadLuma) { spreadMin = fbL; spreadLuma = lL; }
    float lU = dot(fbU, LW); if (lU < spreadLuma) { spreadMin = fbU; spreadLuma = lU; }
    float lD = dot(fbD, LW); if (lD < spreadLuma) { spreadMin = fbD; spreadLuma = lD; }

    
    vec3 blended = mix(fb, spreadMin, intensity);

    
    blended = mix(blended, vec3(1.0), decay);

    
    vec3 result = min(source.rgb, blended);
    result = linearToSrgb(result);

    fragColor = vec4(result, max(source.a, fbAlpha));
}
