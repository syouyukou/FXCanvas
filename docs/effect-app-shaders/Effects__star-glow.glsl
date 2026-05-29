uniform float threshold; // value=0.5, min=0.0, max=4.0, step=0.01
uniform float knee; // value=0.05, min=0.0, max=2.0, step=0.01
uniform float intensity; // value=0.5, min=0.0, max=4.0, step=0.01
uniform float highlight_blend; // label=highlight boost, value=0.0, min=0.0, max=1.0, step=0.01
uniform float streaks; // value=3.0, min=1.0, max=8.0, step=1.0
uniform float sample_count; // value=30.0, min=10.0, max=60.0, step=1.0
uniform float step_px; // label=length, value=80.0, min=0.5, max=200.0, step=0.1
uniform float alternate_length; // label="alternate", value=1.0, min=0.1, max=1.0, step=0.01
uniform float falloff; // value=0.45, min=0.1, max=1.5, step=0.01
uniform float angle_deg; // value=0.0, min=-180.0, max=180.0, step=1.0
uniform float gradient_amount; // label="Colorize", value=1.0, min=0.0, max=1.0, step=0.01
uniform float d_debugGradient; // ui=gradient, label="Gradient map", default=[0:#f4f8ff|1:#79adff]
uniform float gradientShift; // label="Gradient shift", value=0.0, min=-1.0, max=1.0, random=0

#define MAX_STREAKS 8
#define MAX_SAMPLES 60

mat2 rot2D(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, s, -s, c);
}

vec3 sRGBToLinear(vec3 col) {
    bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
    vec3 lower = col / 12.92;
    vec3 higher = pow((col + 0.055) / 1.055, vec3(2.4));
    return mix(higher, lower, vec3(cutoff));
}

vec3 linearToSRGB(vec3 col) {
    col = max(col, vec3(0.0));
    bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
    vec3 lower = col * 12.92;
    vec3 higher = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, vec3(cutoff));
}

float luminance(vec3 col) {
    return dot(col, vec3(0.2126729, 0.7151522, 0.0721750));
}

vec3 extractHighlights(vec3 colLin) {
    float safeKnee = max(knee, 1e-5);
    float y = luminance(colLin);
    float x = max(y - (threshold - safeKnee), 0.0);
    float mask = clamp((x * x) / (4.0 * safeKnee * x + 1e-6), 0.0, 1.0);
    return colLin * mask;
}

vec3 applyHighlightBoost(vec3 colLin) {
    float highlightPower = 9.0;
    float highlightAmount = mix(0.0, 2.0, clamp(highlight_blend, 0.0, 1.0));
    return colLin + pow(max(colLin, vec3(0.0)), vec3(highlightPower)) * highlightAmount;
}

vec3 gradientTint(float t) {
    float rawT = clamp(t, 0.0, 1.0) + gradientShift;
    float gradientT = rawT - floor(rawT);
    if (gradientT < 0.001 && rawT > 0.001) gradientT = 1.0;

    vec3 gradLin = sRGBToLinear(texture(iChannel5, vec2(gradientT, 0.5)).rgb);
    float gradLum = max(luminance(gradLin), 1e-4);
    vec3 chromaOnly = gradLin / gradLum;
    return mix(vec3(1.0), chromaOnly, clamp(gradient_amount, 0.0, 1.0));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 px = 1.0 / iResolution.xy;

    vec3 baseLin = sRGBToLinear(texture(iChannel0, uv).rgb);
    float angle = radians(angle_deg);
    int streakCount = clamp(int(round(streaks)), 1, MAX_STREAKS);
    int samples = clamp(int(round(sample_count)), 1, MAX_SAMPLES);

    vec3 boostedBaseLin = applyHighlightBoost(baseLin);
    vec3 streakLin = extractHighlights(boostedBaseLin) * gradientTint(0.0);
    float totalWeight = 1.0;

    for (int s = 0; s < MAX_STREAKS; s++) {
        if (s >= streakCount) break;

        
        float streakMultiplier = mod(float(s), 2.0) < 0.5 ? 1.0 : alternate_length;
        float streakLength = max(step_px * streakMultiplier, 1e-3);
        float sigma = max(streakLength * falloff, 1e-3);
        float streakAngle = angle + (float(s) * 3.14159265359 / float(streakCount));
        vec2 dir = vec2(cos(streakAngle), sin(streakAngle));

        for (int i = 1; i <= MAX_SAMPLES; i++) {
            if (i > samples) break;

            float t = float(i) / float(samples);
            float d = t * streakLength;
            float w = exp(-(d * d) / (2.0 * sigma * sigma));
            vec3 tint = gradientTint(t);

            vec2 off = dir * d * px;
            vec3 c0 = applyHighlightBoost(sRGBToLinear(texture(iChannel0, uv + off).rgb));
            vec3 c1 = applyHighlightBoost(sRGBToLinear(texture(iChannel0, uv - off).rgb));

            streakLin += extractHighlights(c0) * w * tint;
            streakLin += extractHighlights(c1) * w * tint;
            totalWeight += 2.0 * w;
        }
    }

    streakLin /= max(totalWeight, 1e-6);

    vec3 glareOnly = streakLin * intensity;
    fragColor = vec4(linearToSRGB(baseLin + glareOnly), 1.0);
}
