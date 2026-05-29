uniform float threshold; // value=0.8, min=0.1, max=2.0, step=0.01
uniform float intensity; // value=1.5, min=0.0, max=5.0, step=0.01
uniform float knee; // value=0.4, min=0.0, max=2.0, step=0.01

#define DOWNSAMPLE_BLUR_RADIUS 5

#define UPSAMPLE_BLUR
#define OPTIMIZED_UPSAMPLE_BLUR

#define MAX_LOD 6

#define STEPS 512
#define MAX_DIST 100.
#define EPS 1e-4

#define PI (acos(-1.))
#define TAU (PI*2.)

vec4 SampleLod(sampler2D tex, vec2 uv, vec2 res, const int lod)
{
    vec2 hres = floor(res / 2.0);

    vec2 nres = hres;
    float xpos = 0.0;
    int i = 0;
    for (; i < lod; i++)
    {
        xpos += nres.x;

        nres = floor(nres / 2.0);
    }

    vec2 nuv = uv * vec2(nres);

    nuv = clamp(nuv, vec2(0.5), vec2(nres)-0.5);
    nuv += vec2(xpos, 0);

    return texture(tex, nuv / res);
}

float safeacos(float x) { return acos(clamp(x, -1.0, 1.0)); }

float saturate(float x) { return clamp(x, 0., 1.); }
vec2 saturate(vec2 x) { return clamp(x, vec2(0), vec2(1)); }
vec3 saturate(vec3 x) { return clamp(x, vec3(0), vec3(1)); }

float sqr(float x) { return x*x; }
vec2 sqr(vec2 x) { return x*x; }
vec3 sqr(vec3 x) { return x*x; }

float luminance(vec3 col) { return dot(col, vec3(0.2126729, 0.7151522, 0.0721750)); }

float softKneeMask(float y, float t, float k)
{
    float safeKnee = max(k, 1e-6);
    float x = max(y - (t - safeKnee), 0.0);
    return clamp((x * x) / (4.0 * safeKnee * x + 1e-6), 0.0, 1.0);
}

mat2 rot2D(float a)
{
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}


vec3 palette(float t)
{
    return .5 + .5 * cos(TAU * (vec3(1, 1, 1) * t + vec3(0, .33, .67)));
}



float hash12(vec2 p)
{
	vec3 p3  = fract(vec3(p.xyx) * .1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
}

float hash13(vec3 p3)
{
	p3  = fract(p3 * .1031);
    p3 += dot(p3, p3.zyx + 31.32);
    return fract((p3.x + p3.y) * p3.z);
}

vec2 hash22(vec2 p)
{
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx+33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec2 hash23(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yzx+33.33);
    return fract((p3.xx+p3.yz)*p3.zy);
}

vec3 hash33(vec3 p3)
{
	p3 = fract(p3 * vec3(.1031, .1030, .0973));
    p3 += dot(p3, p3.yxz+33.33);
    return fract((p3.xxy + p3.yxx)*p3.zyx);
}

vec3 sRGBToLinear(vec3 col)
{
    bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
    vec3 lower = col / 12.92;
    vec3 higher = pow((col + 0.055) / 1.055, vec3(2.4));
    return mix(higher, lower, vec3(cutoff));
}

vec3 linearTosRGB(vec3 col)
{
    col = max(col, vec3(0.0));
    bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
    vec3 lower = col * 12.92;
    vec3 higher = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, vec3(cutoff));
}

vec3 Uncharted2TonemapPartial(vec3 x)
{
    float A = 0.15;
    float B = 0.50;
    float C = 0.10;
    float D = 0.20;
    float E = 0.02;
    float F = 0.30;
    return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;
}

vec3 Uncharted2Tonemap(vec3 x)
{
    const float E = 2.5;
    const float W = 11.2;

    return Uncharted2TonemapPartial(x * E) / Uncharted2TonemapPartial(vec3(W));
}



vec3 ACESFilm(vec3 x)
{
    float a = 2.51f;
    float b = 0.03f;
    float c = 2.43f;
    float d = 0.59f;
    float e = 0.14f;
    return clamp((x*(a*x + b)) / (x*(c*x + d) + e), 0.0f, 1.0f);
}



vec3 ReinhardExt(vec3 col, const float w)
{
    vec3 n = col * (1.0 + col / (w * w));
    return n / (1.0 + col);
}

vec3 ReinhardExtLuma(vec3 col, const float w)
{
    float l = luminance(col);
    float n = l * (1.0 + l / (w * w));
    float ln = n / (1.0 + l);
    return col * ln / l;
}



vec3 GlobalLogTonemap(vec3 col, const float ymin, const float ymax, const float t)
{
    float y = luminance(col);
    float a = (ymax - ymin) * t;
    float lm = log(ymin + a);
    float yn = (log(y + a) - lm) / (log(ymax + a) - lm);
    return col * yn / y;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec2 uv = fragCoord/iResolution.xy;

    

    
    vec3 colorLin = sRGBToLinear(texture(iChannel0, uv).rgb);

    
    
    float Y = luminance(colorLin);

    
    float brightnessMask = softKneeMask(Y, threshold, knee);

    
    
    vec3 brightColor = colorLin * brightnessMask * intensity;

    
    
    
    fragColor = vec4(brightColor, 1.0);
}
