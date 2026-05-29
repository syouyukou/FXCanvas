#define PI 3.14159265359
#define GOLDEN_ANGLE 2.39996322972865332
#define MAX_SAMPLES 1000




uniform vec2  center;      // label=center, value=(0.5, 0.5), min=0, max=1, pickable
uniform float radius;      // label=radius, value=0.35, min=0.01, max=4.0, step=0.01
uniform float aspect;      // label=aspect stretch, value=0.0, min=0.0, max=5.0, step=0.05, desc=ellipse stretch amount
uniform float maskRotation; // label=mask rotation, value=0.0, min=-180, max=180, step=1.0, desc=rotate blur mask
uniform float falloff;     // label=falloff, value=2.0, min=0.5, max=6.0, step=0.1, desc=gradient steepness
uniform float maxRadius;   // label=blur strength, value=0.01, min=0.0, max=0.1, step=0.001
uniform float samples;     // label=samples, value=150.0, min=10.0, max=1000.0, step=10.0, desc=blur quality, random=0

uniform float blades;      // label=blades, value=6.0, min=3.0, max=10.0, step=1.0, desc=aperture blade count
uniform float roundness;   // label=blade roundness, value=0.0, min=0.0, max=1.0, step=0.01
uniform float apertureRot; // label=aperture rotation, value=0.0, min=-180, max=180, step=1.0
uniform float feather;     // label=aperture feather, value=0.0, min=0.0, max=0.9, step=0.01
uniform float anamorphic;  // label=anamorphic stretch, value=1.0, min=1.0, max=3.0, step=0.01

uniform float catadioptric;      // label=catadioptric, value=0.0, min=0.0, max=0.7, step=0.01, desc=mirror lens obstruction

uniform float invertMask;  // label=invert mask, value=0.0, min=0.0, max=1.0, step=1.0, ui=switch
uniform float debugMask;   // label=debug mask, value=0.0, min=0.0, max=1.0, step=1.0, ui=switch, random=0
uniform float debugAperture; // label=debug aperture, value=0.0, min=0.0, max=1.0, step=1.0, ui=switch, random=0



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



float deg2rad(float d) { return d * (PI / 180.0); }

mat2 rot2(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}



float ngonBoundary(float theta, float N) {
    float a = 2.0 * PI / N;
    float t = mod(theta + 0.5*a, a) - 0.5*a;
    return cos(PI / N) / max(cos(t), 1e-6);
}

float apertureBoundary(float theta) {
    if (blades < 3.0) return 1.0; 
    float N = max(blades, 3.0);
    float poly = ngonBoundary(theta, N);
    return mix(poly, 1.0, clamp(roundness, 0.0, 1.0));
}

float apertureFeather(float r01) {
    float f = clamp(feather, 0.0, 0.95);
    if (f <= 0.0) return 1.0;
    return smoothstep(1.0, 1.0 - f, r01);
}



float catadioptricTransmission(float r01) {
    if (catadioptric <= 0.0) return 1.0; 
    
    
    float obstruction = catadioptric;
    
    
    return smoothstep(obstruction - 0.05, obstruction, r01);
}



vec2 vogelDir(float i, out float theta) {
    theta = i * GOLDEN_ANGLE;
    return vec2(cos(theta), sin(theta));
}



vec2 applyAnamorphic(vec2 off) {
    float a = max(anamorphic, 1.0);
    off.x *= a;
    off.y *= (1.0 / a);
    return off;
}



vec3 Bokeh(sampler2D tex, vec2 uv, float radius, float amount)
{
    vec3 acc = vec3(0.0);
    vec3 div = vec3(0.0);

    
    vec2 pixel = vec2(iResolution.y / max(iResolution.x, 1e-6), 1.0) * radius;

    float rot = deg2rad(apertureRot);
    float N = clamp(samples, 1.0, float(MAX_SAMPLES));

    for (int si = 0; si < MAX_SAMPLES; ++si)
    {
        float i = float(si);
        if (i >= N) break;

        float theta;
        vec2 dir = vogelDir(i, theta);

        
        float r01 = sqrt((i + 0.5) / N);

        float th = theta + rot;
        float R = apertureBoundary(th);

        
        vec2 off = (rot2(rot) * dir) * (r01 * R);

        
        off = applyAnamorphic(off);

        
        float trans = apertureFeather(r01);
        
        
        trans *= catadioptricTransmission(r01);

        vec3 col = srgbToLinear(texture(tex, uv + pixel * off).rgb);

        
        vec3 w = vec3(5.0) + pow(col, vec3(9.0)) * amount;
        w *= trans;

        acc += col * w;
        div += w;
    }

    return acc / max(div, vec3(1e-6));
}



vec3 debugApertureFootprint(vec2 uv)
{
    vec2 p = uv - vec2(0.5, 0.5); 
    float ar = iResolution.x / max(iResolution.y, 1e-6);
    p.x *= ar;

    float displayScale = 0.25; 
    
    
    float a = max(anamorphic, 1.0);
    vec2 pTransformed = p;
    pTransformed.x /= a;
    pTransformed.y *= a;
    
    
    pTransformed = rot2(-deg2rad(apertureRot)) * pTransformed;
    
    
    float ang = atan(pTransformed.y, pTransformed.x);
    float r = length(pTransformed);
    
    
    float R = apertureBoundary(ang);
    
    
    float edge = smoothstep(R * displayScale + 0.002, R * displayScale - 0.002, r);
    
    
    if (catadioptric > 0.0) {
        float centerBlock = smoothstep(catadioptric * displayScale - 0.002, catadioptric * displayScale + 0.002, r);
        edge *= centerBlock;
    }
    
    return vec3(edge);
}



float radialMask(vec2 uv)
{
    vec2 p = uv - center;

    
    float ar = iResolution.x / max(iResolution.y, 1e-6);
    p.x *= ar;

    
    p = rot2(-deg2rad(maskRotation)) * p;

    
    p /= max(radius, 1e-6);

    
    if (aspect > 0.0) {
        float stretch = 1.0 + aspect;
        float normalize = 1.0 / sqrt(stretch);
        p.x *= stretch * normalize;
        p.y *= normalize;
    }

    
    float t = clamp(length(p), 0.0, 1.0);

    
    t = mix(t, 1.0 - t, invertMask);
    
    
    float mask = pow(smoothstep(0.0, 1.0, t), max(falloff, 1e-6));

    return mask;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    vec2 uv = fragCoord.xy / iResolution.xy;

    
    if (debugMask > 0.5) {
        float m = radialMask(uv);
        fragColor = vec4(vec3(m), 1.0);
        return;
    }

    
    if (debugAperture > 0.5) {
        fragColor = vec4(debugApertureFootprint(uv), 1.0);
        return;
    }

    float a = 150.0;                 
    float m = radialMask(uv);        
    float blurRadius = maxRadius * m; 

    
    vec3 linearColor = Bokeh(iChannel0, uv, blurRadius, a);
    vec3 srgbColor = linearToSrgb(linearColor);

    fragColor = vec4(srgbColor, 1.0);
}
