


const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform int d_texture;        // ui=texture, label="Texture", channel=2, default=Custom/atmosphere.jpg
uniform int fit;              // ui=switcher, label=Fit type, options=[Fill:0|Stretch:1|Tile:2]
uniform float textureScale;   // label=texture scale, value=1.0, min=1.0, max=5.0, step=0.01

uniform float d_curve;        // ui=curve, label="map curve"
uniform int direction;        // ui=switcher, label=Direction, options=[XY:0|X:1|Y:2]

vec2 calculateTextureUV(vec2 uv, int fitMode, float scale) {
    if (fitMode == 0) {
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

        return (adjustedUV - 0.5) / scale + 0.5;

    } else if (fitMode == 1) {
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

        return adjustedUV * scale;
    }
}

vec4 sampleCurves(float x) {
    return texture(iChannel5, vec2(clamp(x, 0.0, 1.0), 0.5));
}

float applyMasterCurve(float v) {
    if (d_curve > 0.5) return v;
    return sampleCurves(v).a;
}

vec4 run(vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;

    vec2 mappedUV = calculateTextureUV(uv, fit, textureScale);
    vec2 sampleUV = (fit == 2) ? fract(mappedUV) : clamp(mappedUV, 0.0, 1.0);
    vec3 displacementColor = texture(iChannel2, sampleUV).rgb;
    float d = dot(displacementColor, vec3(0.299, 0.587, 0.114));
    d = applyMasterCurve(d);

    return vec4(vec3(d), 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = run(fragCoord);
}
