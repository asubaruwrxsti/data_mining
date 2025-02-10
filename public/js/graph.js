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