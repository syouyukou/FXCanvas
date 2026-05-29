
uniform int d_lut;              // ui=lut-slider, label="B&W LUT", channel=2, options=[Agfa Scala 200:Film/data/bw/Agfa-Scala-200.bin|Ilford Delta 100:Film/data/bw/Ilford-Delta-100.bin|Ilford Delta 400:Film/data/bw/Ilford-Delta-400.bin|Ilford Delta 3200:Film/data/bw/Ilford-Delta-3200.bin|Ilford FP4:Film/data/bw/Ilford-FP4.bin|Ilford HP5:Film/data/bw/Ilford-HP5.bin|Kodak Tri-X 200:Film/data/bw/Kodak-Tri-X-200.bin], value=0
uniform float d_lut_size;       // value=1.0, hidden
uniform vec2 amounts;           // label=Amount, value=(1.0,1.0), min=0.0, max=2.0, step=0.01, flip-y=false, pro


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


vec3 sampleLut3D(sampler2D lut, vec3 color, float size) {
    vec3 scaled = clamp(color, 0.0, 1.0) * (size - 1.0);

    float b0 = floor(scaled.b);
    float b1 = min(b0 + 1.0, size - 1.0);
    float bFrac = scaled.b - b0;

    vec2 uv0, uv1;
    uv0.x = (b0 + (scaled.r + 0.5) / size) / size;
    uv0.y = (scaled.g + 0.5) / size;
    uv1.x = (b1 + (scaled.r + 0.5) / size) / size;
    uv1.y = uv0.y;

    vec3 c0 = texture(lut, uv0).rgb;
    vec3 c1 = texture(lut, uv1).rgb;

    return mix(c0, c1, bFrac);
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord.xy / iResolution.xy;
    vec4 src = texture(iChannel0, uv);
    vec3 color = src.rgb;

    if (d_lut_size > 1.0) {
        vec3 graded = sampleLut3D(iChannel2, color, d_lut_size);

        vec3 origLab = linearToOklab(sRGBToLinear(color));
        vec3 gradLab = linearToOklab(sRGBToLinear(graded));

        float mixedL  = mix(origLab.x,  gradLab.x,  amounts.y);
        vec2  mixedAB = mix(origLab.yz, gradLab.yz, min(amounts.x, 1.0));

        color = linearTosRGB(oklabToLinear(vec3(mixedL, mixedAB)));
        color = clamp(color, 0.0, 1.0);
    }

    fragColor = vec4(color, src.a);
}
