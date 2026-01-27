function isMobile() {
    var agentDetails = window.navigator.userAgent
    if (
        /Android|Mobi|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            agentDetails,
        )
    ) {
        return true
    } else {
        return false
    }
}

export default isMobile