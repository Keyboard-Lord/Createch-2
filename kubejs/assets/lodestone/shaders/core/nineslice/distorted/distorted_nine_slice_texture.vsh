#version 400 core

#moj_import <lodestone:common_math.glsl>

in vec3 Position;
in vec4 Color;
in vec2 UV0;
in ivec2 UV2;

uniform sampler2D Sampler2;

uniform mat4 ModelViewMat;
uniform mat4 ProjMat;
uniform int FogShape;

struct DATA {
    vec3 localVertexPos;
    vec4 vertexColor;
    float vertexDistance;
    vec2 texCoord0;
    vec2 texCoord2;
};
out DATA data_out;

void main() {
    vec4 vsPos = ModelViewMat * vec4(Position, 1.0);
    gl_Position = ProjMat * vsPos;

    data_out.localVertexPos = Position;
    data_out.vertexColor = Color * texelFetch(Sampler2, UV2 / 16, 0);
    data_out.vertexDistance = fogDistance(vsPos.xyz, FogShape);
    data_out.texCoord0 = UV0;
    data_out.texCoord2 = UV2;
}