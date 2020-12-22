import React,{useReducer,useEffect} from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import CardList from './Components/CardList';
import SearchBox from './Components/SearchBox';
import "./App.css";

const reducer = (currState,action)=>{
    switch(action.type){
        case 'fetchedItemJson':
            console.log("dispatch-ItemData",action.payload);
            return action.payload
        default:
            return currState
    };
}

const App = () => {
    const [itemList, dispatch] = useReducer(reducer, []);

    //side effect when page first time rendered
    useEffect(() => {
        const URL = "http://localhost:8000/fetchItems";

        const fetchJSON_fromServer = async ()=>{
            const itemList = await (await fetch(URL)).json()
            dispatch({type:"fetchedItemJson",payload:itemList});
        }
        fetchJSON_fromServer();
    }, [])

    return (
        <div class = "container" >
            <span class="text1">IIITM-Kart</span>
            <span class="text2">A Shopping site for IIITM students</span>
            <SearchBox />
            <CardList itemList={itemList} />
        </div>

    )
}

export default App;
