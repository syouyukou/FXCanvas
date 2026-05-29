uniform int d_texture;          // ui=texture-slider, label="Film stock", channel=2, value=0, options=[Agfa APX 400:film-grain/Agfa-APX-400.webp|Agfa HDC 100:film-grain/Agfa-HDC-100.webp|Agfa HDC 400:film-grain/Agfa-HDC-400.webp|Fuji Pro 160S:film-grain/Fuji-Pro-160S.webp|Fuji Pro 400H:film-grain/Fuji-Pro-400H.webp|Fuji Provia 100F:film-grain/Fuji-Provia-100F.webp|Fuji Superia 200 I:film-grain/Fuji-Superia-200-1.webp|Fuji Superia 200 II:film-grain/Fuji-Superia-200-2.webp|Fuji Superia Reala 100:film-grain/Fuji-Superia-Reala-100.webp|Ilford Delta 3200:film-grain/Ilford-Delta-3200.webp|Ilford HP5 400:film-grain/Ilford-HP5-400.webp|Ilford Kentmere 400:film-grain/Ilford-Kentmere-400.webp|Ilford XP2 400:film-grain/Ilford-XP2-400.webp|Kodak Ektachrome E100:film-grain/Kodak-Ektachrome-E100.webp|Kodak Portra 800:film-grain/Kodak-Portra-800.webp|Kodak T-Max 3200:film-grain/Kodak-T-Max-3200-2.webp|Kodak Tri-X 400:film-grain/Kodak-Tri-X-400.webp|Rollei R3 200:film-grain/Rollei-R3-200.webp]

uniform float grainAmount;      // label=Amount, value=0.5, min=0.0, max=1.0, step=0.01
uniform float highlightWeight;  // label=Highlights, value=0.5, min=0.0, max=1.0, step=0.01
uniform float midtoneWeight;    // label=Midtones, value=1.0, min=0.0, max=1.0, step=0.01
uniform float shadowWeight;     // label=Shadows, value=0.5, min=0.0, max=1.0, step=0.01
uniform float frameInterval;    // label="Frame Interval", value=0.0, min=0.0, max=60.0, step=1.0

float overlayChannel(float base, float blend) {
    return (base < 0.5)
        ? 2.0 * base * blend
        : 1.0 - 2.0 * (1.0 - base) * (1.0 - blend);
}

vec3 overlayBlend(vec3 base, float blend) {
    return vec3(
        overlayChannel(base.r, blend),
        overlayChannel(base.g, blend),
        overlayChannel(base.b, blend)
    );
}

vec3 overlayBlendRGB(vec3 base, vec3 blend) {
    return vec3(
        overlayChannel(base.r, blend.r),
        overlayChannel(base.g, blend.g),
        overlayChannel(base.b, blend.b)
    );
}

float tonalResponse(float luma) {
    float shadowMask    = 1.0 - smoothstep(0.16, 0.48, luma);
    float highlightMask = smoothstep(0.62, 0.96, luma);
    float midtoneMask   = smoothstep(0.0, 1.0, 1.0 - abs(luma * 2.0 - 1.0));

    return clamp(
        shadowMask    * shadowWeight    +
        midtoneMask   * midtoneWeight   +
        highlightMask * highlightWeight,
        0.0, 1.0
    );
}

float hash11(float p) {
    return fract(sin(p * 127.1) * 43758.5453123);
}

int grainFrameIndex() {
    if(frameInterval <= 0.0) {
        return 0;
    }

    float interval = max(1.0, frameInterval);
    return int(floor(float(iFrame) / interval));
}

vec2 frameTransform(vec2 grainUV, int frameIdx) {
    if(frameIdx == 0) {
        return grainUV;
    }

    float frame = float(frameIdx);
    vec2 shifted = grainUV + vec2(hash11(frame + 11.0), hash11(frame + 29.0));
    vec2 tile = floor(shifted);
    vec2 local = fract(shifted);

    if(hash11(frame + 47.0) < 0.5) {
        local.x = 1.0 - local.x;
    }
    if(hash11(frame + 83.0) < 0.5) {
        local.y = 1.0 - local.y;
    }

    float rot = floor(hash11(frame + 131.0) * 4.0);
    if(rot < 1.0) {
        local = local;
    } else if(rot < 2.0) {
        local = vec2(local.y, 1.0 - local.x);
    } else if(rot < 3.0) {
        local = vec2(1.0 - local.x, 1.0 - local.y);
    } else {
        local = vec2(1.0 - local.y, local.x);
    }

    return tile + local;
}

vec2 tiledGrainUV(vec2 uv) {
    vec2 grainTextureSize = vec2(textureSize(iChannel2, 0));
    vec2 fragCoordEquiv = uv * iResolution.xy;
    return frameTransform(fragCoordEquiv / grainTextureSize, grainFrameIndex());
}

ivec2 wrapTexelCoord(vec2 coord, vec2 texSize) {
    return ivec2(mod(coord, texSize));
}

vec4 sampleTiledGrain(vec2 uv) {
    vec2 texSize = vec2(textureSize(iChannel2, 0));
    vec2 texelPos = uv * texSize - 0.5;

    vec2 base = floor(texelPos);
    vec2 f = fract(texelPos);

    ivec2 p00 = wrapTexelCoord(base, texSize);
    ivec2 p10 = wrapTexelCoord(base + vec2(1.0, 0.0), texSize);
    ivec2 p01 = wrapTexelCoord(base + vec2(0.0, 1.0), texSize);
    ivec2 p11 = wrapTexelCoord(base + vec2(1.0, 1.0), texSize);

    vec4 c00 = texelFetch(iChannel2, p00, 0);
    vec4 c10 = texelFetch(iChannel2, p10, 0);
    vec4 c01 = texelFetch(iChannel2, p01, 0);
    vec4 c11 = texelFetch(iChannel2, p11, 0);

    vec4 cx0 = mix(c00, c10, f.x);
    vec4 cx1 = mix(c01, c11, f.x);
    return mix(cx0, cx1, f.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec4 srcPixel    = texture(iChannel0, uv);
    vec3 sourceColor = clamp(srcPixel.rgb, 0.0, 1.0);
    float luma       = dot(sourceColor, vec3(0.2126, 0.7152, 0.0722));
    float response   = tonalResponse(luma);

    vec2  grainUV     = tiledGrainUV(uv);
    vec4  grainSample = sampleTiledGrain(grainUV);
    bool  isColor     = abs(grainSample.r - grainSample.g) > 0.01 ||
                        abs(grainSample.r - grainSample.b) > 0.01;

    float blendAmount = clamp(response * grainAmount, 0.0, 1.0);
    vec3  overlaid    = isColor
        ? overlayBlendRGB(sourceColor, grainSample.rgb)
        : overlayBlend(sourceColor, grainSample.r);
    vec3  finalColor  = mix(sourceColor, overlaid, blendAmount);

    fragColor = vec4(finalColor, srcPixel.a);
}
