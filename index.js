const canvas = document.getElementById('glCanvas');

function run(canvas){
    const gl = canvas.getContext('webgl');

    if (!gl) {
        alert('WebGL not supported');
    }

    // Vertex shader - positions the geometry
    const vertexShaderSource = `
        attribute vec4 aPosition;
        void main() {
            gl_Position = aPosition;
        }
    `;

    // Fragment shader - colors each pixel
    const fragmentShaderSource = `
        #ifdef GL_ES
            precision mediump float;
        #endif
        uniform vec2 u_resolution;
        uniform vec2 u_mouse;
        uniform float u_time;

        void main() {
            vec2 st = gl_FragCoord.xy / u_resolution;
            vec2 mouse = u_mouse / u_resolution;
            
            float dist = distance(st, mouse);
            float wave = abs(sin(dist * 10.0 - u_time * 2.0));
            
            gl_FragColor = vec4(wave, st.x * wave, st.y, 1.0);
        }
    `;

    // Compile shader
    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    // Create program
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
    }

    gl.useProgram(program);

    // Create a full-screen quad (two triangles)
    const positions = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
         1.0,  1.0,
    ]);

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Get uniform locations
    const uTimeLocation = gl.getUniformLocation(program, 'u_time');
    const uResolutionLocation = gl.getUniformLocation(program, 'u_resolution');
    const uMouseLocation = gl.getUniformLocation(program, 'u_mouse');

    // Track mouse position
    let mouseX = 0;
    let mouseY = 0;

    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = canvas.height - (e.clientY - rect.top); // Flip Y to match WebGL coordinates
    });

    // Animation loop
    function render(time) {
        time *= 0.001; // Convert to seconds
        
        // Pass uniforms to shader
        gl.uniform2f(uResolutionLocation, canvas.width, canvas.height);
        gl.uniform2f(uMouseLocation, mouseX, mouseY);
        gl.uniform1f(uTimeLocation, time);
        
        // Clear and draw
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        requestAnimationFrame(render);
    }
    
    requestAnimationFrame(render);
}

run(canvas);