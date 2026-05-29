

#define PI 3.141596
#define GOLDEN_ANGLE 2.39996323
#define NUMBER 300.0
#define ITERATIONS (GOLDEN_ANGLE * NUMBER)


uniform int d_texture;          // ui=texture, label="Texture", channel=2, default=Custom/blur-texture.jpg
uniform int fit; // ui=switcher, label=Fit type, options=[Fill:0|Stretch:1|Tile:2]
uniform float textureScale;   // label=texture scale, value=1.0, min=1.0, max=5.0, step=0.01, desc=zoom (mode 0) or tile repetitions (mode 2)





uniform float maxRadius;   // label=blur strength, value=0.5, min=0.0, max=0.5, step=0.001, desc=maximum blur radius
uniform float highlightBlend; // label=highlight boost, value=0.0, min=0.0, max=1.0, step=0.01, desc=linear highlight boost amount
uniform float depthInfluence; // label=texture influence, value=1.0, min=0.0, max=1.0, step=0.1, desc=how much the depth map affects blur strength
uniform float d_depth_curve;  // ui=curve, label="Strength curve"
uniform float debugMask;   // label=Preview texture, value=0.0, min=0.0, max=1.0, step=1.0, desc=visualize the depth map, ui=switch, random=0




vec3 srgbToLinear(vec3 c) {
    vec3 lo = c / 12.92;
    vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
    return mix(lo, hi, step(0.04045, c));
}

vec3 linearToSrgb(vec3 c) {
    c = max(c, vec3(0.0));
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(0.0031308, c));
}



float applyDepthCurve(float v) {
    if (d_depth_curve > 0.5) return v;
    return texture(iChannel5, vec2(clamp(v, 0.0, 1.0), 0.5)).a;
}



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



vec2 Sample(in float theta, inout float r)
{
    r += 1.0 / r;
    return (r - 1.0) * vec2(cos(theta), sin(theta));
}



vec3 Bokeh(sampler2D tex, vec2 uv, float radius, float highlightBlend)
{
    vec3 acc = vec3(0.0);
    vec3 div = vec3(0.0);

    
    vec2 pixel = vec2(iResolution.y / iResolution.x, 1.0) * radius * 0.006;

    float highlightPower = 9.0;
    float highlightAmount = mix(0.0, 150.0, highlightBlend);
    float baseWeight = 5.0;

    float r = 1.0;
    for (float j = 0.0; j < ITERATIONS; j += GOLDEN_ANGLE)
    {
        
        vec3 colSrgb = texture(tex, uv + pixel * Sample(j, r), radius * 1.5).xyz;
        vec3 col = srgbToLinear(colSrgb);
        
        
        vec3 bokeh = vec3(baseWeight) + pow(col, vec3(highlightPower)) * highlightAmount;
        acc += col * bokeh;
        div += bokeh;
    }
    return acc / div;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;

    
    vec2 depthUV = calculateTextureUV(uv, fit, textureScale);

    
    
    vec2 sampleUV = (fit == 2) ? fract(depthUV) : clamp(depthUV, 0.0, 1.0);
    vec3 depthColor = texture(iChannel2, sampleUV).rgb;
    float depth = dot(depthColor, vec3(0.299, 0.587, 0.114));
    float depthMapped = applyDepthCurve(depth);
    float depthFactor = mix(1.0, depthMapped, depthInfluence);

    
    if (debugMask > 0.5) {
        fragColor = vec4(vec3(depthMapped), 1.0);
        return;
    }

    float blurRadius = maxRadius * depthFactor; 

    
    vec3 linearColor = Bokeh(iChannel0, uv, blurRadius, highlightBlend);
    vec3 srgbColor = linearToSrgb(linearColor);

    fragColor = vec4(srgbColor, 1.0);
}
