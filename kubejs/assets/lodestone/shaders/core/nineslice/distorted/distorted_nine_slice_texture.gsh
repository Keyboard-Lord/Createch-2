#version 400 core

layout (triangles) in;
layout(triangle_strip, max_vertices = 3) out;

struct DATA {
    vec3 localVertexPos;
    vec4 vertexColor;
    float vertexDistance;
    vec2 texCoord0;
    vec2 texCoord2;
};
in DATA data_out[];

out vec4 vertexColor;
out float vertexDistance;
out vec2 texCoord;
flat out vec2 size;

void main() {
    size = vec2(
        length(data_out[0].localVertexPos - data_out[1].localVertexPos),
        length(data_out[1].localVertexPos - data_out[2].localVertexPos)
    );

    size = round(size);

    for (int i = 0; i < gl_in.length(); i++) {
        gl_Position = gl_in[i].gl_Position;
        vertexColor = data_out[i].vertexColor;
        vertexDistance = data_out[i].vertexDistance;
        texCoord = data_out[i].texCoord0;
        EmitVertex();
    }
    EndPrimitive();
}