



// @gips_version=1 @coord=rel

precision mediump float;

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float threshold;     //label=threshold, value=128, min=0, max=255, step=1, desc=threshold level (0-255, like Photoshop)
uniform float edgeMode;      //label=edge mode, value=0, ui=switch, desc=show 1px edge line at threshold
uniform float offsetAmount; //label=offset amount, value=0, min=0, max=10, step=1, desc=number of offset threshold lines
uniform float offsetDistance; //label=distance, value=0.0, min=1.0, max=50.0, step=1.0, desc=distance between offset threshold lines

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

vec4 run(vec2 pos) {
    vec4 color = pixel(pos);

    
    float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));

    
    float normalizedThreshold = threshold / 255.0;

    if (edgeMode > 0.5) {
        
        vec2 texelSize = 1.0 / iResolution.xy;
        vec2 relTexelSize = vec2(texelSize.x * 2.0 * (iResolution.x / iResolution.y > 1.0 ? (iResolution.x / iResolution.y) : 1.0),
                                texelSize.y * 2.0 * (iResolution.x / iResolution.y < 1.0 ? (iResolution.y / iResolution.x) : 1.0));

        
        vec3 left = pixel(pos + vec2(-relTexelSize.x, 0.0)).rgb;
        vec3 right = pixel(pos + vec2(relTexelSize.x, 0.0)).rgb;
        vec3 up = pixel(pos + vec2(0.0, -relTexelSize.y)).rgb;
        vec3 down = pixel(pos + vec2(0.0, relTexelSize.y)).rgb;

        
        float lumaLeft = dot(left, vec3(0.299, 0.587, 0.114));
        float lumaRight = dot(right, vec3(0.299, 0.587, 0.114));
        float lumaUp = dot(up, vec3(0.299, 0.587, 0.114));
        float lumaDown = dot(down, vec3(0.299, 0.587, 0.114));

        bool isAnyEdge = false;

        
        
        for (int i = 0; i < 21; i++) { 
            if (i > int(offsetAmount) * 2) break;

            
            
            float currentThreshold;
            if (i == 0) {
                currentThreshold = threshold;
            } else {
                int offsetIndex = (i + 1) / 2; 
                float offsetValue = float(offsetIndex) * offsetDistance;
                if (i % 2 == 1) {
                    
                    currentThreshold = threshold + offsetValue;
                } else {
                    
                    currentThreshold = threshold - offsetValue;
                }
            }

            
            if (currentThreshold < 0.0 || currentThreshold > 255.0) continue;

            
            float normalizedCurrentThreshold = currentThreshold / 255.0;

            
            float currentState = step(normalizedCurrentThreshold, luma);
            float leftState = step(normalizedCurrentThreshold, lumaLeft);
            float rightState = step(normalizedCurrentThreshold, lumaRight);
            float upState = step(normalizedCurrentThreshold, lumaUp);
            float downState = step(normalizedCurrentThreshold, lumaDown);

            
            float isEdge = abs(currentState - leftState) +
                           abs(currentState - rightState) +
                           abs(currentState - upState) +
                           abs(currentState - downState);

            if (isEdge > 0.0) {
                isAnyEdge = true;
                break;
            }
        }

        if (isAnyEdge) {
            
            return vec4(0.0, 0.0, 0.0, color.a);
        } else {
            
            return vec4(1.0, 1.0, 1.0, color.a);
        }
    } else {
        
        float thresholdValue = step(normalizedThreshold, luma);
        return vec4(vec3(thresholdValue), color.a);
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
