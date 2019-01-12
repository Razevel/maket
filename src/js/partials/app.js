var App = {
    logger: function (e, message, props) {
        if(e || message) {
            if (props && props.type && props.type !== 'log') {
                if (props.type === 'error') {
                    console.error(e);
                    console.error(message);
                } else {
                    console.warn(e);
                    console.warn(message);
                }
            } else {
                console.log(e);
                console.log(message);
            }
        }
    },
    alerter: function (msg) {
        alert(msg);
    }
};
