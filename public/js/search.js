$(document).ready(function () {
    $("#search-bar").on("input", function (event) {
        if (event.target.value === '') {
            $("#search-results").hide();
            return;
        }
        fetch(`/bio/search?artistName=${event.target.value}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(artists => {
                const searchResults = $("#search-results");
                searchResults.empty();

                if (artists.data.length === 0) {
                    searchResults.hide();
                    return;
                } else {
                    searchResults.show();
                    artists.data.forEach(artist => {
                        const artistItem = $(`<button class="artist-result"> ${artist.ARTIST}</button>`);
                        artistItem.on('click', () => {
                            $("#search-bar").val(artist.ARTIST);
                            searchResults.hide();
                            filterArtist(artist.ARTIST);
                        });
                        searchResults.append(artistItem);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching artists:', error);
                $("#search-results").empty().append('<li>Error loading results</li>').show();
            });
    });
});

$("#clear-search").on('click', function () {
    $("#search-bar").val('');
    resetFilter();
});