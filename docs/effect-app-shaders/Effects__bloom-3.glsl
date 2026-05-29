uniform float bloom_factor; // value=0.6, min=0.0, max=1.0, step=0.01
uniform float blend_mode; // value=0.0, min=0.0, max=1.0, step=1.0
uniform float tonemapper; // value=0.0, min=0.0, max=7.0, step=1.0

#define ROTATION

#define DOWNSAMPLE_BLUR_RADIUS 5

#define UPSAMPLE_BLUR
#define OPTIMIZED_UPSAMPLE_BLUR

#define MAX_LOD 6

#define STEPS 512
#define MAX_DIST 100.
#define EPS 1e-4

#define PI (acos(-1.))
#define TAU (PI*2.)

vec4 SampleLod(sampler2D tex, vec2 uv, vec2 res, const int lod) {
    vec2 hres = floor(res / 2.0);

    vec2 nres = hres;
    float xpos = 0.0;
    int i = 0;
    for(; i < lod; i++) {
        xpos += nres.x;

        nres = floor(nres / 2.0);
    }

    vec2 nuv = uv * vec2(nres);

    nuv = clamp(nuv, vec2(0.5), vec2(nres) - 0.5);
    nuv += vec2(xpos, 0);

    return texture(tex, nuv / res);
}

float safeacos(float x) {
    return acos(clamp(x, -1.0, 1.0));
}

float saturate(float x) {
    return clamp(x, 0., 1.);
}
vec2 saturate(vec2 x) {
    return clamp(x, vec2(0), vec2(1));
}
vec3 saturate(vec3 x) {
    return clamp(x, vec3(0), vec3(1));
}

float sqr(float x) {
    return x * x;
}
vec2 sqr(vec2 x) {
    return x * x;
}
vec3 sqr(vec3 x) {
    return x * x;
}

float luminance(vec3 col) {
    return dot(col, vec3(0.2126729, 0.7151522, 0.0721750));
}

mat2 rot2D(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}


vec3 palette(float t) {
    return .5 + .5 * cos(TAU * (vec3(1, 1, 1) * t + vec3(0, .33, .67)));
}



float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3) {
    p3 = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec2 hash23(vec3 p3) {
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy);
}

vec3 hash33(vec3 p3) {
    p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz + 33.33);
    return fract((p3.xxy + p3.yxx) * p3.zyx);
}

vec3 sRGBToLinear(vec3 col) {
    bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
    vec3 lower = col / 12.92;
    vec3 higher = pow((col + 0.055) / 1.055, vec3(2.4));
    return mix(higher, lower, vec3(cutoff));
}

vec3 linearTosRGB(vec3 col) {
    col = max(col, vec3(0.0));
    bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
    vec3 lower = col * 12.92;
    vec3 higher = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, vec3(cutoff));
}

vec3 Uncharted2TonemapPartial(vec3 x) {
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    return ((x * (A * x + C * B) + D * E) / (x * (A * x + B) + D * F)) - E / F;
}

vec3 Uncharted2Tonemap(vec3 x) {
    const float E = 2.5;
    const float W = 11.2;

    return Uncharted2TonemapPartial(x * E) / Uncharted2TonemapPartial(vec3(W));
}



vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
}



vec3 ReinhardExt(vec3 col, const float w) {
    vec3 n = col * (1.0 + col / (w * w));
    return n / (1.0 + col);
}

vec3 ReinhardExtLuma(vec3 col, const float w) {
    float l = luminance(col);
    float n = l * (1.0 + l / (w * w));
    float ln = n / (1.0 + l);
    return col * ln / l;
}



vec3 GlobalLogTonemap(vec3 col, const float ymin, const float ymax, const float t) {
    float y = luminance(col);
    float a = (ymax - ymin) * t;
    float lm = log(ymin + a);
    float yn = (log(y + a) - lm) / (log(ymax + a) - lm);
    return col * yn / y;
}

vec4 SampleLodBlurred(sampler2D tex, vec2 uv, vec2 res, const int lod) {
    vec4 result = vec4(0);
    float sc = exp2(float(lod));
    vec2 nres = floor(res / sc * 0.5);

    #ifndef OPTIMIZED_UPSAMPLE_BLUR
    const float[9] weights = float[](1., 2., 1., 2., 4., 2., 1., 2., 1.);

    float w = 0.0;
    for(int x = -1; x <= 1; x++) {
        for(int y = -1; y <= 1; y++) {
            vec2 o = vec2(x, y);
            float wg = weights[x + 1 + (y + 1) * 3];
            vec2 p = uv + o / nres;

            result += wg * SampleLod(iChannel0, saturate(p), iResolution.xy, lod);
            w += wg;
        }
    }
    result /= w;

    
    
    #else

    const vec2[4] offsets = vec2[](vec2(-1.0 / 3.0, -1.0 / 3.0), vec2(1.0 / 3.0, -1.0 / 3.0), vec2(-1.0 / 3.0, 1.0 / 3.0), vec2(1.0 / 3.0, 1.0 / 3.0));

    for(int i = 0; i < 4; i++) {
        vec2 o = offsets[i];
        vec2 p = uv + o / nres;

        result += SampleLod(iChannel0, saturate(p), iResolution.xy, lod);
    }
    result *= 0.25;

    #endif

    return result;
}

vec3 getBase(vec2 uv) {
    vec4 textureSample = texture(iChannel7, uv); 
    vec3 color = sRGBToLinear(textureSample.rgb) * textureSample.a;

    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec3 col = vec3(0);

    #ifndef UPSAMPLE_BLUR
    col += SampleLod(iChannel0, uv, iResolution.xy, 0).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 1).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 2).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 3).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 4).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 5).rgb;

    #else

    
    #if 1
    col += SampleLod(iChannel0, uv, iResolution.xy, 0).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 1).rgb;
    col += SampleLod(iChannel0, uv, iResolution.xy, 2).rgb;
    #else
    col += SampleLodBlurred(iChannel0, uv, iResolution.xy, 0).rgb;
    col += SampleLodBlurred(iChannel0, uv, iResolution.xy, 1).rgb;
    col += SampleLodBlurred(iChannel0, uv, iResolution.xy, 2).rgb;
    #endif

    col += SampleLodBlurred(iChannel0, uv, iResolution.xy, 3).rgb;
    col += SampleLodBlurred(iChannel0, uv, iResolution.xy, 4).rgb;
    col += SampleLodBlurred(iChannel0, uv, iResolution.xy, 5).rgb;

    #endif

    col /= 6.0;

    
    vec3 baseColor = getBase(uv);
    vec3 bloomColor = col * bloom_factor;

    if (blend_mode == 0.0) {
        
        col = 1.0 - (1.0 - baseColor) * (1.0 - bloomColor);
    } else if (blend_mode == 1.0) {
        
        col = baseColor + bloomColor;
    }

    
    if (tonemapper == 1.0) {
        col = col / (1.0 + col);
    } else if (tonemapper == 2.0) {
        col = ACESFilm(col * 0.55);
    } else if (tonemapper == 3.0) {
        col = Uncharted2Tonemap(col);
    } else if (tonemapper == 4.0) {
        col = ReinhardExt(col, 5.5);
    } else if (tonemapper == 5.0) {
        col = ReinhardExtLuma(col, 2.5);
    } else if (tonemapper == 6.0) {
        col = col / (1.0 + luminance(col));
    } else if (tonemapper == 7.0) {
        col = GlobalLogTonemap(col, 0.0, 3.5, 0.15);
    } else {
        col = col;
    }

    fragColor = vec4(linearTosRGB(col), 1);
    fragColor += (dot(hash23(vec3(fragCoord, iTime)), vec2(1)) - 0.5) / 255.;
}
