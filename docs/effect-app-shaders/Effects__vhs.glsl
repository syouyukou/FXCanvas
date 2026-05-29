// @animated



precision highp float;
precision highp int;

#define PI 3.14159265359
#define SAMPLES 6

uniform float internalWidth;   // label=resolution, value=320.0, min=128.0, max=1024.0, step=1.0

uniform float distortion;      // label=distortion, value=0.23, min=0.0, max=2.5, step=0.01
uniform float colorBleed;      // label=color fringing, value=2.0, min=0.0, max=2.0, step=0.01
uniform float tapeWave;        // label=wobble, value=2.0, min=0.0, max=2.0, step=0.01
uniform float tapeCrease;      // label=tape crease, value=0.50, min=0.0, max=2.0, step=0.01
uniform float tracking;        // label=tracking noise, value=2.0, min=0.0, max=2.0, step=0.01
uniform float verticalJump;    // label=vertical jump, value=0.05, min=0.0, max=2.0, step=0.01
uniform float creaseSparkle;   // label=sparkle, value=1.0, min=0.0, max=2.0, step=0.01
uniform float acBeat;          // label=flicker, value=0.06, min=0.0, max=2.0, step=0.01
uniform float chromaNoise;     // label=grain, value=0.75, min=0.0, max=2.0, step=0.01
uniform float saturation;      // label=saturation, value=2.0, min=0.0, max=2.5, step=0.01
uniform float yiqShift;        // label=color shift, value=0.1, min=0.0, max=2.0, step=0.01
uniform float colorUnderMix;   // label=color blend, value=1.0, min=0.0, max=1.0, step=0.01
uniform float lumaBandwidth;   // label=softness, value=0.5, min=0.4, max=2.0, step=0.01
uniform float chromaDelay;     // label=color delay, value=5.8, min=0.0, max=8.0, step=0.1
uniform float sharpening;      // label=sharpening, value=0.25, min=0.0, max=2.0, step=0.01

float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float valueNoise256(vec2 uv, vec2 seed) {
    
    vec2 p = fract(uv) * 256.0;
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float n00 = hash12(i + seed);
    float n10 = hash12(i + vec2(1.0, 0.0) + seed);
    float n01 = hash12(i + vec2(0.0, 1.0) + seed);
    float n11 = hash12(i + vec2(1.0, 1.0) + seed);
    return mix(mix(n00, n10, f.x), mix(n01, n11, f.x), f.y);
}

float vhsNoise(vec2 uv) {
    return valueNoise256(uv, vec2(17.0, 91.0));
}

vec3 vhsNoise3(vec2 uv, vec2 t) {
    vec2 b = uv + t;
    return vec3(
        valueNoise256(b, vec2(17.0, 91.0)),
        valueNoise256(b + vec2(0.37, 0.11), vec2(53.0, 13.0)),
        valueNoise256(b + vec2(0.79, 0.53), vec2(29.0, 71.0))
    );
}

mat2 rotate2D(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

vec3 rgb2yiq(vec3 rgb) {
    return mat3(
        0.299, 0.596, 0.211,
        0.587, -0.274, -0.523,
        0.114, -0.322, 0.312
    ) * rgb;
}

vec3 yiq2rgb(vec3 yiq) {
    return mat3(
        1.000, 1.000, 1.000,
        0.956, -0.272, -1.106,
        0.621, -0.647, 1.703
    ) * yiq;
}

vec3 sampleSourceInternal(vec2 uv, vec2 vhsRes) {
    
    
    uv = clamp(uv, vec2(0.0), vec2(1.0));
    vec2 p = uv * vhsRes - 0.5;
    vec2 i = floor(p);
    vec2 f = fract(p);

    vec2 uv00 = clamp((i + vec2(0.5, 0.5)) / vhsRes, vec2(0.0), vec2(1.0));
    vec2 uv10 = clamp((i + vec2(1.5, 0.5)) / vhsRes, vec2(0.0), vec2(1.0));
    vec2 uv01 = clamp((i + vec2(0.5, 1.5)) / vhsRes, vec2(0.0), vec2(1.0));
    vec2 uv11 = clamp((i + vec2(1.5, 1.5)) / vhsRes, vec2(0.0), vec2(1.0));

    vec3 c00 = texture(iChannel0, uv00).rgb;
    vec3 c10 = texture(iChannel0, uv10).rgb;
    vec3 c01 = texture(iChannel0, uv01).rgb;
    vec3 c11 = texture(iChannel0, uv11).rgb;
    return mix(mix(c00, c10, f.x), mix(c01, c11, f.x), f.y);
}

float sampleLumaLPF(vec2 uv, vec2 vhsRes, float bandwidth) {
    
    float sigma = mix(2.2, 0.6, clamp((bandwidth - 0.4) / 1.6, 0.0, 1.0));
    float invTwoSigma2 = 0.5 / max(sigma * sigma, 1e-5);

    float acc = 0.0;
    float wSum = 0.0;
    for (int k = -2; k <= 2; k++) {
        float fk = float(k);
        vec2 tapUV = clamp(uv + vec2(fk, 0.0) / vhsRes, vec2(0.0), vec2(1.0));
        float y = rgb2yiq(sampleSourceInternal(tapUV, vhsRes)).x;
        float w = exp(-fk * fk * invTwoSigma2);
        acc += y * w;
        wSum += w;
    }
    return acc / max(wSum, 1e-6);
}

vec3 sampleColorUnder(vec2 uv, vec2 vhsRes) {
    
    const int TAP_RADIUS = 6;
    const float CHROMA_BANDWIDTH = 0.2;
    const float CARRIER_JITTER = 0.5;

    if (any(lessThan(uv, vec2(0.0))) || any(greaterThan(uv, vec2(1.0)))) {
        return vec3(0.10);
    }

    vec3 centerYiq = rgb2yiq(sampleSourceInternal(uv, vhsRes));
    float luma = sampleLumaLPF(uv, vhsRes, lumaBandwidth);

    
    vec2 uvChroma = clamp(uv - vec2(chromaDelay / max(vhsRes.x, 1.0), 0.0), vec2(0.0), vec2(1.0));
    float line = floor(uv.y * vhsRes.y);
    float cyclesPerLine = 40.0; 
    float linePhase = hash12(vec2(line, float(iFrame) * 0.73)) * 2.0 * PI * CARRIER_JITTER;

    
    float palAlt = (mod(line, 2.0) > 0.5) ? -1.0 : 1.0;

    float sigma = mix(9.0, 2.0, clamp((CHROMA_BANDWIDTH - 0.2) / 1.8, 0.0, 1.0));
    float invTwoSigma2 = 0.5 / max(sigma * sigma, 1e-5);

    float iAcc = 0.0;
    float qAcc = 0.0;
    float wSum = 0.0;

    for (int k = -TAP_RADIUS; k <= TAP_RADIUS; k++) {
        float fk = float(k);
        vec2 tapUV = uvChroma + vec2(fk, 0.0) / vhsRes;
        tapUV = clamp(tapUV, vec2(0.0), vec2(1.0));

        vec3 tapYiq = rgb2yiq(sampleSourceInternal(tapUV, vhsRes));
        float iSig = tapYiq.y;
        float qSig = tapYiq.z * palAlt;

        float phase = 2.0 * PI * (cyclesPerLine * tapUV.x) + linePhase;
        float c = cos(phase);
        float s = sin(phase);

        
        float encoded = iSig * c + qSig * s;
        float w = exp(-fk * fk * invTwoSigma2);
        iAcc += encoded * c * w;
        qAcc += encoded * s * w;
        wSum += w;
    }

    float iDec = (2.0 * iAcc) / max(wSum, 1e-6);
    float qDec = (2.0 * qAcc) / max(wSum, 1e-6) * palAlt;
    vec2 chroma = vec2(iDec, qDec);

    if (abs(colorBleed) > 1e-5) {
        chroma = rotate2D(colorBleed * 0.12) * chroma;
    }

    vec3 colorUnderYiq = vec3(mix(centerYiq.x, luma, 0.75), chroma.x, chroma.y);
    vec3 decoded = yiq2rgb(colorUnderYiq);
    vec3 original = sampleSourceInternal(uv, vhsRes);
    return mix(original, decoded, clamp(colorUnderMix, 0.0, 1.0));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    float aspect = iResolution.x / max(iResolution.y, 1.0);
    vec2 vhsRes = vec2(max(internalWidth, 1.0), max(internalWidth / max(aspect, 1e-5), 1.0));
    vec2 uvOut = fragCoord / iResolution.xy;

    
    vec2 uv = uvOut;
    float t = iTime;

    vec2 uvn = uv;

    
    
    const float VHS_FPS = 29.97;
    float vhsFrame = floor(t * VHS_FPS);
    float framePhase = fract(t * VHS_FPS);

    float jumpEventPrev = smoothstep(0.92, 0.995, vhsNoise(vec2(floor((vhsFrame - 1.0) * 0.80), 37.0)));
    float jumpEventCurr = smoothstep(0.92, 0.995, vhsNoise(vec2(floor(vhsFrame * 0.80), 37.0)));

    float jumpSizePrev = (0.03 + 0.17 * vhsNoise(vec2(floor((vhsFrame - 1.0) * 1.70), 51.0))) * jumpEventPrev;
    float jumpSizeCurr = (0.03 + 0.17 * vhsNoise(vec2(floor(vhsFrame * 1.70), 51.0))) * jumpEventCurr;

    float jumpDriftPrev = (vhsNoise(vec2((vhsFrame - 1.0) * 0.12, 9.4)) - 0.5) * 0.02;
    float jumpDriftCurr = (vhsNoise(vec2(vhsFrame * 0.12, 9.4)) - 0.5) * 0.02;

    float jumpOffsetPrev = (jumpSizePrev + jumpDriftPrev) * verticalJump;
    float jumpOffsetCurr = (jumpSizeCurr + jumpDriftCurr) * verticalJump;
    float jumpLerp = smoothstep(0.15, 0.85, framePhase);
    uvn.y = fract(uvn.y + mix(jumpOffsetPrev, jumpOffsetCurr, jumpLerp));

    
    uvn.x += (vhsNoise(vec2(uvn.y * 0.10, t * 0.10)) - 0.5) / vhsRes.x * distortion * tapeWave;
    uvn.x += (vhsNoise(vec2(uvn.y, t * 10.0)) - 0.5) / vhsRes.x * distortion * tapeWave;

    
    float creaseSeed = vhsNoise(t * vec2(0.67, 0.59));
    float tcPhase = smoothstep(
        0.9,
        0.96,
        sin(uvn.y * 8.0 - (t + 0.14 * creaseSeed) * PI * 1.2)
    );
    float tcNoise = smoothstep(0.3, 1.0, vhsNoise(vec2(uvn.y * 4.77, t)));
    float tc = tcPhase * tcNoise * tapeCrease;
    uvn.x -= tc / vhsRes.x * 8.0 * distortion;

    
    float snPhase = smoothstep(6.0 / vhsRes.y, 0.0, uvn.y);
    uvn.y += snPhase * 0.3 * tracking;
    uvn.x += snPhase * ((vhsNoise(vec2(uv.y * 100.0, t * 10.0)) - 0.5) / vhsRes.x * 24.0 * tracking);

    vec3 col = sampleColorUnder(uvn, vhsRes);

    
    float cn = tcNoise * (0.3 + 0.7 * tcPhase) * creaseSparkle;
    if (cn > 0.29) {
        vec2 uvt = (uvn + vec2(vhsNoise(vec2(uvn.y, t)), 0.0)) * vec2(0.1, 1.0);
        float n0 = vhsNoise(uvt);
        float n1 = vhsNoise(uvt + vec2(1.0 / vhsRes.x, 0.0));
        if (n1 < n0) {
            col = mix(col, vec3(2.0, 1.0, 1.0), pow(n0, 10.0));
        }
    }

    
    float ac = smoothstep(0.4, 0.6, vhsNoise(vec2(0.0, 0.1 * (uv.y + t * 0.2))));
    col *= 1.0 + 0.1 * acBeat * ac;

    vec3 rgbNoise = vhsNoise3(uvn, t * vec2(5.97, 4.45));
    col *= 0.9 + 0.1 * mix(vec3(1.0), rgbNoise, chromaNoise);

    
    if (sharpening > 1e-5) {
        vec2 sharpStep = vec2(1.0) / max(vhsRes, vec2(1.0));
        vec3 sC = sampleSourceInternal(uvn, vhsRes);
        vec3 sL = sampleSourceInternal(uvn - vec2(sharpStep.x, 0.0), vhsRes);
        vec3 sR = sampleSourceInternal(uvn + vec2(sharpStep.x, 0.0), vhsRes);
        vec3 sU = sampleSourceInternal(uvn - vec2(0.0, sharpStep.y), vhsRes);
        vec3 sD = sampleSourceInternal(uvn + vec2(0.0, sharpStep.y), vhsRes);
        vec3 sBlur = 0.2 * (sL + sR + sU + sD + sC);
        vec3 detail = sC - sBlur;
        col = clamp(col + detail * (1.2 * sharpening), 0.0, 1.0);
    }

    
    vec3 yiq = rgb2yiq(col);
    yiq = mix(yiq, vec3(0.1, -0.1, 0.0) + vec3(0.9, 1.1, 1.5) * yiq, yiqShift);
    yiq.yz *= saturation;
    col = clamp(yiq2rgb(yiq), 0.0, 1.0);

    fragColor = vec4(col, 1.0);
}