
// @feedback channel=2

uniform vec3 keyColor;      // label=key color, value=(1.0, 1.0, 1.0), ui=color, desc=color used to build the mask
uniform float threshold;    // label=threshold, value=0.550, min=0.0, max=1.0, step=0.001, random=0, desc=key color match cutoff
uniform float persistence;  // label=persistence, value=0.82, min=0.5, max=0.99, step=0.01, random=0, desc=key color mask decay

vec2 analysisDims() {
    float aw = 160.0;
    float ah = max(1.0, floor(aw * iResolution.y / max(iResolution.x, 1.0) + 0.5));
    return vec2(aw, ah);
}

float colorMatch(vec3 color) {
    float dist = length(color - keyColor) / 1.7320508;
    return 1.0 - clamp(dist, 0.0, 1.0);
}

float sampleDownscaledKeyMatch(vec2 uv, vec2 analysisSize) {
    vec2 texel = 0.5 / analysisSize;
    float acc = 0.0;
    acc += colorMatch(texture(iChannel0, clamp(uv, vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2( texel.x, 0.0), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2(-texel.x, 0.0), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2(0.0,  texel.y), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2(0.0, -texel.y), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2( texel.x,  texel.y), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2(-texel.x,  texel.y), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2( texel.x, -texel.y), vec2(0.0), vec2(1.0))).rgb);
    acc += colorMatch(texture(iChannel0, clamp(uv + vec2(-texel.x, -texel.y), vec2(0.0), vec2(1.0))).rgb);
    return acc / 9.0;
}

void detectHit(vec2 uv, vec2 analysisSize, vec4 prevOut, out float mask, out float instantHit, out float eNext, out float matchOut) {
    float matchScore = sampleDownscaledKeyMatch(uv, analysisSize);
    matchOut = matchScore;
    float ePrev = prevOut.b;
    float t = clamp(threshold, 0.0, 1.0);
    instantHit = step(t, matchScore);
    eNext = max(instantHit, ePrev * persistence);
    eNext = clamp(eNext, 0.0, 1.0);
    mask = step(0.5, eNext);
}

vec4 previousAnalysisTexel(vec2 fc) {
    return texelFetch(iChannel2, ivec2(fc), 0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 as = analysisDims();

    if (fragCoord.x >= as.x || fragCoord.y >= as.y) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    vec2 sourceUv = (fragCoord + 0.5) / as;
    vec4 prev = previousAnalysisTexel(fragCoord);
    float mask, instantHit, eNext, matchScore;
    detectHit(sourceUv, as, prev, mask, instantHit, eNext, matchScore);

    fragColor = vec4(mask, instantHit, eNext, matchScore);
}
