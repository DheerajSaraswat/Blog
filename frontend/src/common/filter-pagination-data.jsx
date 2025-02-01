import axios from "axios";

export const filterPaginationData = async ({create_new_array=false, state, data, page, countRoute, data_to_send={}, user})=>{
    let obj;
    let headers = {}
    if(user){
        headers.headers = {
            'Authorization': `Bearer ${user}`
        }
    }
    if(state!=null && !create_new_array){
        obj = {
            ...state, results: [...state.results, ...data], page
        } 
    } else {
        await axios.post(import.meta.env.VITE_SERVER_DOMAIN + countRoute, data_to_send, headers).then(({data:{totalDocs}})=>{
            obj = {results:data, page:1, totalDocs}
            // console.log(obj);
        }).catch(err=>{
            console.log(err);
        })

    }
    return obj;
}