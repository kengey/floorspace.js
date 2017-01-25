import factory from './factory.js'

export default {
    // initialize a new geometry object
    // must update the associated story to reference the geometry
    initGeometry (state, payload) {
        state.push(payload.geometry);
        payload.story.geometry_id = payload.geometry.id;
    },
    createVertex (state, payload) {
        payload.geometry.vertices.push(payload.vertex);
    },
    createEdge (state, payload) {
        payload.geometry.edges.push(payload.edge);
    },
    createFace (state, payload) {
        // build arrays of the vertices and edges associated with the face being created
        const faceVertices = payload.points.map((p, i) => {
            // snapped points already have a vertex id, set a reference to the existing vertex if it is not deleted
            if (p.id && payload.geometry.vertices.find((v) => { return v.id === p.id; })) {
                return {
                    ...payload.geometry.vertices.find((v) => { return v.id === p.id; }),
                    shared: true // mark the vertex as being shared, this will be used during shared edge lookup
                };
            } else {
                // create a new vertex with the point coordinates
                var vertex = new factory.Vertex(p.x, p.y);
                payload.geometry.vertices.push(vertex);
                return vertex;
            }
        });
        const reverseEdgeIndices = [];
        const faceEdges = faceVertices.map((v, i) => {
            const v2 = faceVertices.length > i + 1 ? faceVertices[i + 1] : faceVertices[0];
            // if the vertex is shared between two faces, check to see if the entire edge is shared
            if (v.shared) {
                // find the shared edge if it exists
                var sharedEdge = payload.geometry.edges.find((e) => {
                    return (e.v1 === v.id && e.v2 === v2.id) || (e.v2 === v.id && e.v1 === v2.id);
                });

                if (sharedEdge) {
                    // track the indexes of edges which are reversed for use during face edgeRef creation
                    if (sharedEdge.v1 !== v.id) {
                        reverseEdgeIndices.push(i);
                    }
                    return sharedEdge;
                }
            }

            const edge = new factory.Edge(v.id, v2.id);
            payload.geometry.edges.push(edge);
            return edge;
        });

        const edgeRefs = faceEdges.map((e, i) => {
            return {
                edge_id: e.id,
                reverse: reverseEdgeIndices.indexOf(i) === -1 ? false : true // false // TODO: implement a check for existing edges using the same vertices
            };
        });

        const face = new factory.Face(edgeRefs);
        payload.geometry.faces.push(face);
        payload.space.face_id = face.id;
    },

    splitEdge (state, payload) {
        // look up edge
    },

    destroyVertex (state, payload) {
        payload.geometry.vertices.splice(payload.geometry.vertices.findIndex((v) => {
            return v.id === payload.vertex_id;
        }), 1);
    },
    destroyEdge (state, payload) {
        payload.geometry.edges.splice(payload.geometry.edges.findIndex((e) => {
            return e.id === payload.edge_id;
        }), 1);
    },
    destroyFace (state, payload) {
        payload.geometry.faces.splice(payload.geometry.faces.findIndex((f) => {
            return f.id === payload.space.face_id;
        }), 1);
        payload.space.face_id = null;
    }
}