



// @gips_version=1 @coord=rel

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float dot_scale;    // value=4.2, max=10, desc=scale (logarithmic)
uniform float smoothness;   // value=1, max=10
uniform vec4 angles;       // label=(cyan angle, magenta angle, yellow angle, black angle), value=(15, 75, 0, 45), max=90, step=1, desc=screen angles
uniform float cmykEnabled;  // label=CMYK separation, value=1, ui=switch, desc=CMYK mode

vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 pixel(in vec2 pos) {
    vec2 uv = fromRelCoord(pos);
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0);
}

float halftone(vec2 pos, float value, float angle, float scale) {
    
    
    float x = value * 4.6598 - 3.6598;
    float r = 0.5642 * sqrt(value) + ((x <= 0.0) ? 0.0 : 0.1429 * (1.0 - sqrt(1.0 - x*x)));

    
    float c = cos(angle), s = sin(angle);
    pos = mat2(c, -s, s, c) * pos * scale;
    float d = length(fract(pos) - 0.5);
    float border = smoothness * length(dFdx(pos));
    return smoothstep(0.0, border, r * (1.0 + border) - d);
}

vec4 run(vec2 pos) {
    vec4 color = pixel(pos);
    vec3 rgb = pow(color.rgb, vec3(2.2));  
    float scale = exp(dot_scale);
    vec4 rad = radians(angles);
    if (cmykEnabled > 0.5) {
        float k = 1.0 - max(max(rgb.r, rgb.g), rgb.b);
        vec4 cmyk = clamp(vec4(1.0 - rgb / (1.0 - k), k), 0.0, 1.0);
        cmyk = vec4(
            halftone(pos, cmyk.r, rad.r, scale),
            halftone(pos, cmyk.g, rad.g, scale),
            halftone(pos, cmyk.b, rad.b, scale),
            halftone(pos, cmyk.a, rad.a, scale)
        );
        rgb = (1.0 - cmyk.rgb) * (1.0 - cmyk.a);
    } else {
        rgb = vec3(
            halftone(pos, rgb.r, rad.r, scale),
            halftone(pos, rgb.g, rad.g, scale),
            halftone(pos, rgb.b, rad.b, scale)
        );
    }
    return vec4(pow(rgb, vec3(1.0/2.2)), color.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
