import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/risk-analysis`;


class RdRiskService {


    // Get all projects
   getAllRiskAnalysis() {
    return axios.get(BASE_URL);
}



    // Get risk details by project id
    getRiskDetails(projectId) {

        return axios.get(
            `${BASE_URL}/${projectId}`
        );

    }



    // Download risk report
   

    


}


export default new RdRiskService();