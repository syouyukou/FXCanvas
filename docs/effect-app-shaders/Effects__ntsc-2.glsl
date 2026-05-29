



precision highp float;
precision highp int;







#define PI 3.14159265359


const float AM_DECODE_HIGHPASS_WAVELENGTH = 2.0;
const float AM_DEMODULATE_WAVELENGTH = 2.0;
const float PHASE_ALTERNATION = 0.0;



uniform int WINDOW_RADIUS;  // label=ringing, value=20, min=5, max=30, step=1


uniform float WINDOW_BIAS;  // label=smear, value=0.0, min=-0.2, max=0.2, step=0.01

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

float DecodeAM(sampler2D sampler, in vec2 uv, in float pixelWidth)
{
    highp float phaseAM = uv.x * PI / (AM_DEMODULATE_WAVELENGTH * pixelWidth);

    float decoded = 0.0;
    float windowWeight = 0.0;
    for(int i = -WINDOW_RADIUS; i <= WINDOW_RADIUS; i++)
    {
        
        float window = WindowCosine(float(i) / float(WINDOW_RADIUS+1));

        vec2 uvWithOffset = vec2(uv.x + float(i) * pixelWidth, uv.y);
        float sinc = Sinc(float(i)/AM_DECODE_HIGHPASS_WAVELENGTH)/AM_DECODE_HIGHPASS_WAVELENGTH;

        
        float encodedSample = (texture2D(sampler, uvWithOffset).r - 0.5) * 4.0;

        decoded += encodedSample * sinc * window;
        windowWeight += window;
    }

    
    return (decoded) * sin(phaseAM) * 4.0;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord / iResolution.xy;
    vec2 pixelSize = 1.0 / iResolution.xy;

    float value = DecodeAM(iChannel0, uv, pixelSize.x);

    
    value = clamp(value * 0.25 + 0.5, 0.0, 1.0);

    fragColor.rgb = vec3(value);
    fragColor.a = 1.0;

    
    

    
    
}
