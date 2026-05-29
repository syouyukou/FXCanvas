
// @gips_version=1 @coord=rel

uniform int border_shape;       // ui=option-slider, label="Border Shape", options=[Oval:0|Triangle:1|Diamond:2|Rectangle:3|Hexagon:4|Octagon:5], value=0
uniform float size;             // label=size, value=0.65, min=0.05, max=2.0, step=0.01
uniform float anamorphism;      // label=anamorphism, value=1.0, min=0.25, max=4.0, step=0.01
uniform float rotation;         // label=rotation, value=0.0, min=-180.0, max=180.0, step=0.1
uniform vec2 center;            // label=(center X, center Y), value=(0.0, 0.0), min=-1.0, max=1.0, step=0.001, pickable, random=0

uniform float softness;         // label=softness, value=1.00, min=0.0, max=1.0, step=0.01
uniform float transparency;     // label=transparency, value=1.0, min=0.0, max=1.0, step=0.01
uniform vec3 vignette_color;    // label=color, value=(0.0, 0.0, 0.0), ui=color, random=0
uniform int composite_type;     // ui=option-slider, label="Composite Type", options=[Normal:0|Add:1|Subtract:2|Difference:3|Multiply:4|Screen:5|Overlay:6|Hard light:7|Softlight:8|Darken:9], value=0

uniform float global_blend;     // label=blend, value=1.0, min=0.0, max=1.0, step=0.01
uniform float dithering;        // label=dithering, value=1.0, ui=switch, random=0


vec3 sRGBToLinear(vec3 c) {
    vec3 lo = c / 12.92;
    vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
    return mix(lo, hi, step(0.04045, c));
}

vec3 linearTosRGB(vec3 c) {
    c = max(c, vec3(0.0));
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(0.0031308, c));
}


float luminance(vec3 col) { return dot(col, vec3(0.2126729, 0.7151522, 0.0721750)); }
float luma709(vec3 color) { return dot(color, vec3(0.2126, 0.7152, 0.0722)); }



vec3 linearToOklab(vec3 c) {
    vec3 l = vec3(
        0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b,
        0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b,
        0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b
    );
    vec3 lc = sign(l) * pow(abs(l), vec3(1.0 / 3.0));
    return vec3(
        0.2104542553 * lc.x + 0.7936177850 * lc.y - 0.0040720468 * lc.z,
        1.9779984951 * lc.x - 2.4285922050 * lc.y + 0.4505937099 * lc.z,
        0.0259040371 * lc.x + 0.7827717662 * lc.y - 0.8086757660 * lc.z
    );
}

vec3 oklabToLinear(vec3 lab) {
    vec3 lc = vec3(
        lab.x + 0.3963377774 * lab.y + 0.2158037573 * lab.z,
        lab.x - 0.1055613458 * lab.y - 0.0638541728 * lab.z,
        lab.x - 0.0894841775 * lab.y - 1.2914855480 * lab.z
    );
    vec3 l = lc * lc * lc;
    return vec3(
         4.0767416621 * l.x - 3.3077115913 * l.y + 0.2309699292 * l.z,
        -1.2684380046 * l.x + 2.6097574011 * l.y - 0.3413193965 * l.z,
        -0.0041960863 * l.x - 0.7034186147 * l.y + 1.7076147010 * l.z
    );
}


#define PI 3.141592653589793

float deg2rad(float d) {
    return d * (PI / 180.0);
}

mat2 rot2(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat2(c, -s, s, c);
}

float ngonBoundary(float theta, float n) {
    float a = 2.0 * PI / n;
    float t = mod(theta + 0.5 * a, a) - 0.5 * a;
    return cos(PI / n) / max(cos(t), 1e-5);
}

vec2 shapeSpace(vec2 uv) {
    vec2 uvCenter = center * 0.5 + 0.5;
    vec2 p = uv - uvCenter;

    
    float ar = iResolution.x / max(iResolution.y, 1e-6);
    p.x *= ar;

    p = rot2(-deg2rad(rotation)) * p;
    p /= max(size, 1e-6);

    float stretch = max(anamorphism, 1e-3);
    float normalize = 1.0 / sqrt(stretch);
    p.x *= stretch * normalize;
    p.y *= normalize;
    return p;
}

float regularPolygonRadius(vec2 p, float sides) {
    float theta = atan(p.y, p.x);
    return length(p) / max(ngonBoundary(theta, sides), 1e-5);
}

float shapeRadius(vec2 p) {
    if (border_shape == 1) return regularPolygonRadius(p, 3.0) * 0.643326; 
    if (border_shape == 2) return (abs(p.x) + abs(p.y)) * 0.797885;
    if (border_shape == 3) return max(abs(p.x), abs(p.y)) * 1.128379;
    if (border_shape == 4) return regularPolygonRadius(p, 6.0) * 0.909391;
    if (border_shape == 5) return regularPolygonRadius(p, 8.0) * 0.949016;
    return length(p);
}

float vignetteMask(vec2 p) {
    float r = shapeRadius(p);
    float aa = max(fwidth(r), 1e-4);
    float inner = clamp(1.0 - softness, 0.0, 1.0);
    return smoothstep(inner - aa, 1.0 + aa, r);
}

float orderedDither(vec2 fragCoord) {
    vec2 p = floor(fragCoord);
    float bayer = mod(p.x + p.y * 2.0, 4.0);
    bayer = (bayer == 0.0) ? 0.0 : (bayer == 1.0) ? 2.0 : (bayer == 2.0) ? 3.0 : 1.0;
    float hash = fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    return mix((bayer + 0.5) / 4.0, hash, 0.35) - 0.5;
}

vec3 overlayBlend(vec3 base, vec3 blend) {
    vec3 low = 2.0 * base * blend;
    vec3 high = 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
    return mix(low, high, step(vec3(0.5), base));
}

vec3 softLightBlend(vec3 base, vec3 blend) {
    vec3 d = ((16.0 * base - 12.0) * base + 4.0) * base;
    vec3 g = mix(d, sqrt(max(base, vec3(0.0))), step(vec3(0.25), base));
    vec3 low = base - (1.0 - 2.0 * blend) * base * (1.0 - base);
    vec3 high = base + (2.0 * blend - 1.0) * (g - base);
    return mix(low, high, step(vec3(0.5), blend));
}

vec3 composite(vec3 base, vec3 layer, float amount) {
    vec3 boundedBase = clamp(base, 0.0, 1.0);
    vec3 boundedLayer = clamp(layer, 0.0, 1.0);
    vec3 blended = layer;

    if (composite_type == 1) {
        blended = base + layer;
    } else if (composite_type == 2) {
        blended = base - layer;
    } else if (composite_type == 3) {
        blended = abs(base - layer);
    } else if (composite_type == 4) {
        blended = base * layer;
    } else if (composite_type == 5) {
        blended = 1.0 - (1.0 - base) * (1.0 - layer);
    } else if (composite_type == 6) {
        blended = overlayBlend(boundedBase, boundedLayer);
    } else if (composite_type == 7) {
        blended = overlayBlend(boundedLayer, boundedBase);
    } else if (composite_type == 8) {
        blended = softLightBlend(boundedBase, boundedLayer);
    } else if (composite_type == 9) {
        blended = min(base, layer);
    }

    return mix(base, blended, amount);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 src = texture(iChannel0, uv);
    vec3 baseLin = sRGBToLinear(src.rgb);
    vec3 tintLin = sRGBToLinear(vignette_color);

    float mask = vignetteMask(shapeSpace(uv));
    float amount = clamp(mask * transparency, 0.0, 1.0);

    vec3 compositedLin = composite(baseLin, tintLin, amount);
    vec3 resultLin = mix(baseLin, compositedLin, clamp(global_blend, 0.0, 1.0));

    if (dithering > 0.5) {
        float ditherAmount = (1.0 / 255.0) * clamp(src.a * global_blend * transparency, 0.0, 1.0);
        resultLin += orderedDither(fragCoord) * ditherAmount;
    }

    fragColor = vec4(linearTosRGB(resultLin), src.a);
}
