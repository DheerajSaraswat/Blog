const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Oct", "Nov", "Dec"];
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const getDate = (timestamp)=>{
    const date = new Date(timestamp)
    return `${date.getDate()} ${months[date.getMonth()]}`;
}
export default getDate;

export const getFullDay = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}