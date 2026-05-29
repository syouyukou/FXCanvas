// @animated




precision highp float;
precision highp int;







#define PI 3.14159265359


const float COLORBURST_WAVELENGTH_DECODER = 3.0;
const float DECODE_LOWPASS_WAVELENGTH = 4.5;
const float PHASE_ALTERNATION = 0.0;


mat3 MatrixYIQToRGB = mat3(1.0,  0.956,  0.619,
                           1.0, -0.272, -0.647,
                           1.0, -1.106, 1.703);



uniform int WINDOW_RADIUS;  // label=ringing, value=20, min=5, max=30, step=1


uniform float NTSC_SCALE;  // label=encoding, value=1.0, min=0.5, max=5.0, step=0.1


uniform float NOISE_STRENGTH;  // label=noise, value=0.01, min=0.0, max=1.0, step=0.01


uniform float SATURATION;  // label=saturation, value=2.0, min=0.0, max=5.0, step=0.1


uniform float WINDOW_BIAS;  // label=smear, value=0.0, min=-0.2, max=0.2, step=0.01



float hash1(float p)
{
    
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;

    
    p = fract(p * 0.2067);
    p *= p + 19.19;
    p *= p + p;

    
    p = fract(p * 0.3897);
    p *= p + 29.29;

    return fract(p);
}

float RandomFloat01(inout float state)
{
    state = hash1(state);
    return state;
}


float Sinc(float x)
{
    x *= PI;
    return (x == 0.0) ? 1.0 : sin(x)/x;
}

float WindowCosine(float x)
{
    
    float x_clamped = clamp(x, -0.9999, 0.9999);  
    float atanh_x = 0.5 * log((1.0 + x_clamped) / (1.0 - x_clamped));

    
    float biased = atanh_x + WINDOW_BIAS;

    
    float biased2 = biased * biased;
    float tanh_result = biased * (27.0 + biased2) / (27.0 + 9.0 * biased2);

    return cos(PI * tanh_result) * 0.5 + 0.5;
}

vec3 DecodeNTSC(sampler2D sampler, in vec2 uv, in float pixelWidth, vec2 rng, bool alternatePhase)
{
    
    float seed = rng.y;
    vec2 originalUV = uv;

    
    float noise1 = RandomFloat01(seed);
    seed = hash1(seed + 0.365);
    float noise2 = RandomFloat01(seed);
    seed = hash1(seed + 0.841);
    float noise3 = RandomFloat01(seed);

    
    vec3 rowNoiseIntensity = vec3(noise1, noise2, noise3);
    rowNoiseIntensity = pow(rowNoiseIntensity, vec3(500.0)) * 1.0;

    
    float horizOffsetNoise = RandomFloat01(seed) * 2.0 - 1.0;
    horizOffsetNoise *= rowNoiseIntensity.x * 0.5 * NOISE_STRENGTH;
    uv.x += horizOffsetNoise;

    
    seed = hash1(seed * 1.618);
    float phaseNoise = RandomFloat01(seed) * 2.0 - 1.0;
    phaseNoise *= rowNoiseIntensity.y * 0.5 * 3.1415927 * NOISE_STRENGTH;

    
    seed = hash1(seed * 2.718);
    float frequencyNoise = RandomFloat01(seed) * 2.0 - 1.0;
    frequencyNoise *= rowNoiseIntensity.z * 0.5 * 3.1415927 * NOISE_STRENGTH;

    float alt = 0.0;
    if(alternatePhase)
        alt = PHASE_ALTERNATION;


    vec3 yiq = vec3(0.0);
    float windowWeight = 0.0;
    for(int i = -WINDOW_RADIUS; i <= WINDOW_RADIUS; i++)
    {
        
        float window = WindowCosine(float(i) / float(WINDOW_RADIUS+1));

        vec2 uvWithOffset = vec2(uv.x + float(i) * pixelWidth, uv.y);
        vec2 originalUVWithOffset = vec2(originalUV.x + float(i) * pixelWidth, originalUV.y);
        highp float phase = originalUVWithOffset.x * PI / ((COLORBURST_WAVELENGTH_DECODER + frequencyNoise) * pixelWidth) + phaseNoise + alt;

        float sincY = Sinc(float(i)/DECODE_LOWPASS_WAVELENGTH)/DECODE_LOWPASS_WAVELENGTH;
        float sinI = sin(phase);
        float sinQ = cos(phase);

        
        float encodedSample = (texture2D(sampler, uvWithOffset).r - 0.5) * 4.0;

        yiq.x += encodedSample * sincY * window;
        yiq.y += encodedSample * sinI * window;
        yiq.z += encodedSample * sinQ * window;
        windowWeight += window;
    }

    yiq.yz *= SATURATION / windowWeight;

    
    vec3 rgb = MatrixYIQToRGB * yiq;

    
    return clamp(rgb, vec3(0.0), vec3(1.0));
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 pixelSize = 1.0 / iResolution.xy;

    
    float rngStateRow = float(fragCoord.y * 9277.0 + float(iFrame) * 26699.0) + 1.0;
    float rngStateCol = float(fragCoord.x * 1973.0 + float(iFrame) * 26699.0) + 1.0;

    
    fragColor.rgb = DecodeNTSC(iChannel0, uv, pixelSize.x * NTSC_SCALE, vec2(rngStateCol, rngStateRow), mod(float(iFrame) + fragCoord.y, 2.0) < 0.5);
    fragColor.a = 1.0;
}
