const LIMIT = 500;
const graph = new graphology.Graph({ multi: true });

fetch(`/bio?limit=${LIMIT}`, {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json',
    },
})
    .then(response => response.json())
    .then(artists => {
        artists.data.forEach(artist => {

            fetch(`/bio/artist-timeline?artist=${artist.ARTIST}&limit=${LIMIT}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })
                .then(response => response.json())
                .then(result => {

                    const arrayData = result.data || result;
                    arrayData.forEach((item, index) => {
                        if (index === 0) {
                            return;
                        }

                        const previousLocation = arrayData[index - 1].LOCATION;
                        const currentLocation = item.LOCATION;

                        if (!graph.hasNode(previousLocation)) {
                            graph.addNode(previousLocation, { label: previousLocation, x: Math.random(), y: Math.random(), color: '#000000', size: 4 });
                        }

                        if (!graph.hasNode(currentLocation)) {
                            graph.addNode(currentLocation, { label: currentLocation, x: Math.random(), y: Math.random(), color: '#000000', size: 4 });
                        }

                        graph.addEdge(previousLocation, currentLocation, {
                            label: `${previousLocation} to ${currentLocation}`,
                            color: 'purple',
                        });
                    });

                    let maxDegree = 0;
                    graph.forEachNode(node => {
                        const degree = graph.degree(node);
                        if (degree > maxDegree) {
                            maxDegree = degree;
                        }
                    });

                    graph.forEachNode(node => {
                        const degree = graph.degree(node);
                        const normalizedSize = 4 + ((degree / maxDegree) * 8);
                        graph.setNodeAttribute(node, 'size', normalizedSize);
                    });
                })
                .catch(error => console.error(error));
        });
    })
    .catch(error => console.error(error));

function filterArtist(artistName) {
    if (!artistName) {
        return;
    }
    fetch(`/bio/artist-timeline?artist=${artistName}&limit=${LIMIT}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    }).then(response => response.json())
        .then(result => {
            const arrayData = result.data || result;
            const relatedNodes = new Set();
            const relatedEdges = new Set();

            arrayData.forEach((item, index) => {
                if (index === 0) {
                    return;
                }

                const previousLocation = arrayData[index - 1].LOCATION;
                const currentLocation = item.LOCATION;

                relatedNodes.add(previousLocation);
                relatedNodes.add(currentLocation);
                relatedEdges.add(`${previousLocation}-${currentLocation}`);
                relatedEdges.add(`${currentLocation}-${previousLocation}`);
            });

            graph.forEachNode(node => {
                if (!artistName || relatedNodes.has(node)) {
                    graph.setNodeAttribute(node, 'color', '#000000');
                } else {
                    graph.setNodeAttribute(node, 'color', '#D3D3D3');
                }
            });

            graph.forEachEdge(edge => {
                const source = graph.source(edge);
                const target = graph.target(edge);
                const edgeKey = `${source}-${target}`;

                if (!artistName || relatedEdges.has(edgeKey)) {
                    graph.setEdgeAttribute(edge, 'color', '#000000');
                } else {
                    graph.setEdgeAttribute(edge, 'color', '#D3D3D3');
                }
            });
        })
        .catch(error => console.error(error));
}

function resetFilter() {
    graph.forEachNode(node => {
        graph.setNodeAttribute(node, 'color', '#000000');
    });

    graph.forEachEdge(edge => {
        graph.setEdgeAttribute(edge, 'color', 'purple');
    });
}