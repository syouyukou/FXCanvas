



// @gips_version=1 @coord=rel @filter=off

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float gscale;    // label=glitch scale, value=0.38, max=5, desc=global scale (logarithmic)
uniform float oscale;    // label=offset scale, value=3.44, max=5, desc=octave scale (logarithmic)
uniform float angle;     // value=34, max=180, step=1
uniform vec3 strength;  // label=(red shift strength, green shift strength, blue shift strength), value=(0.29, 0.29, 0.25), desc=strength (low/mid/high octave)
uniform vec3 threshold; // label=(red threshold, green threshold, bleu threshold), value=(0.76, 0.9, 0.66), desc=threshold (low/mid/high octave)
uniform float seed;      // label=random seed, value=0.365, step=0.001, desc=random seed

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

uint xxhash32(uvec4 p) {
    const uint PRIME32_2 = 2246822519U, PRIME32_3 = 3266489917U;
    const uint PRIME32_4 = 668265263U, PRIME32_5 = 374761393U;
    uint h32 =  p.w + PRIME32_5 + p.x*PRIME32_3;
    h32 = PRIME32_4*((h32 << 17) | (h32 >> (32 - 17)));
    h32 += p.y * PRIME32_3;
    h32 = PRIME32_4*((h32 << 17) | (h32 >> (32 - 17)));
    h32 += p.z * PRIME32_3;
    h32 = PRIME32_4*((h32 << 17) | (h32 >> (32 - 17)));
    h32 = PRIME32_2*(h32^(h32 >> 15));
    h32 = PRIME32_3*(h32^(h32 >> 13));
    return h32^(h32 >> 16);
}

vec3 rand(vec3 p) {
    const float PRIME_0 = 123123137.0;
    const uint PRIME32_1 = 2654435761U, PRIME32_2 = 805459861U;

    uvec4 u = uvec4(abs(p), abs(seed * PRIME_0));

    uint u1 = xxhash32(u);
    uint u2 = xxhash32(u + PRIME32_1);
    uint u3 = xxhash32(u + PRIME32_2);

    uvec3 uVec = uvec3(u1, u2, u3);
    return vec3(uVec) * (1.0 / float(0xFFFFFFFFU));
}

vec4 run(vec2 pos) {
    float c = cos(radians(angle)), s = sin(radians(angle));

    
    vec3 oct = floor(dot(pos, vec2(-s,c)) * vec3(exp(gscale), exp(gscale + oscale), exp(gscale + 2.0 * oscale)));

    
    vec3 noise = rand(oct) * 2.0 - 1.0;

    
    bvec3 sign = lessThan(noise, vec3(0.0));
    noise = abs(noise);

    
    noise = max(vec3(0.0), noise - threshold);
    noise = mix(noise, -noise, sign);

    
    return pixel(pos + vec2(c,s) * dot(noise, (exp2(strength) - 1.0) / (1.01 - threshold)));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
