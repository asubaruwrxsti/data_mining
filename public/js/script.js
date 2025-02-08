// Page load animation
$(document).ready(function () {
    $("#fade-text1").css({ top: '50px', opacity: 0 }).show().animate({ top: '0px', opacity: 1 }, { duration: 800, easing: 'easeOutQuad' });
    $("#fade-text2").css({ top: '100px', opacity: 0 }).show().animate({ top: '0px', opacity: 1 }, { duration: 1600, easing: 'easeOutQuad' });
    $("#fade-text3").css({ top: '150px', opacity: 0 }).show().animate({ top: '0px', opacity: 1 }, { duration: 2000, easing: 'easeOutQuad' });

    let sigma = null;

    setTimeout(function () {
        $("#welcome-text").animate({ top: '-50px', opacity: 0 }, {
            duration: 1000, easing: 'easeInQuad', complete: function () {
                $(this).remove();
                $("#main-content").css({ top: '50px', opacity: 0, display: 'block' }).animate({ top: '0px', opacity: 1 }, { duration: 1000, easing: 'easeOutQuad' });

                // Sigma.js graph
                sigma = new Sigma(graph, document.getElementById("graph-container"));
            }
        });
    }, 3500);
});