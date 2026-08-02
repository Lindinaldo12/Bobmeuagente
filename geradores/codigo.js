function gerar(tipo, nome) {

    switch (tipo.toLowerCase()) {

        case "classe":

            return `class ${nome} {

    constructor() {

    }

}

module.exports = ${nome};
`;

        case "funcao":

            return `function ${nome}() {

}

module.exports = {
    ${nome}
};
`;

        case "api":

            return `const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {

    res.json({
        status: "OK"
    });

});

module.exports = router;
`;

        default:

            return "// Tipo de código não suportado.";

    }

}

module.exports = {
    gerar
};
