import './App.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [accessToken, setAccessToken] = useState('');
  const login = useGoogleLogin({
    onSuccess: tokenResponse => {
      setAccessToken(tokenResponse?.access_token);
    },
  });
  console.log("accessToken->>>>", accessToken)
  const [apiUrl, setApiUrl] = useState(null);
  const [apiUrlHeader, setApiUrlHeader] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [labelArray, setLabelArray] = useState('');

  console.log("process.env.REACT_APP_BASE_URL->>>",process.env.REACT_APP_BASE_URL)
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        const data = response.data;
        const email = data?.email;
        setUserEmail(email);
        axios.post(`${process.env.REACT_APP_BASE_URL}api/messages`, { email: email, accessToken: accessToken })
          .then(response => {
            console.log("response->>>", response);
            const { data } = response;
            const Api_url = data?.message?.config?.url;
            const api_header = data?.message?.config?.headers;
            console.log("Api_url->>>>", Api_url, "api_header->>>>>", api_header)
            setApiUrl(Api_url);
            setApiUrlHeader(api_header);
          })
          .catch(error => console.log("error", error));
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUserDetails();
  }, [accessToken]);

  const [showDropDown, setShowDpropDow] = useState();
  useEffect(() => {
    if (apiUrlHeader && apiUrl) {
      console.log("apiUrlHeader && apiUrl", apiUrlHeader, apiUrl);
      axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userEmail}/labels?maxResults=5&labelListVisibility=labelShow`, {
        headers: apiUrlHeader
      })
        .then(apiUrlData => {
          console.log("apiUrlData->>>", apiUrlData);
          const { labels } = apiUrlData.data;
          setShowDpropDow(labels);
        }).catch(error => console.log("error", error));
    }

  }, [userEmail,apiUrl, apiUrlHeader]);
  console.log("showDropDown->>>", showDropDown);
  const handleSelectChange = (event) => {
    console.log(event.target.value);
    const name_Selected = event.target.value;
    axios.get(`https://www.googleapis.com/gmail/v1/users/${userEmail}/messages?labelIds=${name_Selected}`, {
      headers: apiUrlHeader
    }).then(response => {
      console.log("labelResoponseresponse->>>", response);
      const { messages } = response?.data;
      console.log("labelResoponseresponse->>>", messages);
      setLabelArray(messages);
    })
      .catch(error => console.log("error", error));
  }

  const [showData, setShowData] = useState([]);
  useEffect(() => {
    if (labelArray) {
      const promises = labelArray.map(element => {
        return axios.get(`https://gmail.googleapis.com/gmail/v1/users/${userEmail}/messages/${element.id}`, {
          headers: apiUrlHeader
        });
      });
      Promise.all(promises)
        .then(allData => {
          const formattedData = allData.map(data => data.data);
          setShowData(formattedData);
        })
        .catch(error => console.log("error", error));
    }
  }, [labelArray,userEmail,apiUrlHeader]);
  console.log("apiUrlDataapiUrlDataapiUrlData->>>", showData);
  return (
    <div className="App">
      <h2>Sign with google</h2>
      <button className='googleSignIN' onClick={() => login()}>Log-in with Google</button>
      {/* show all dropdown */}
      <select name="" id="" value={showDropDown} onChange={handleSelectChange}>
        <option disabled selected >-select--</option>
        {
          showDropDown ?
            showDropDown.map((item, key) => {
              return (
                <option key={key} value={item.id} >{item.name}</option>
              )
            }) : ''
        }
      </select>
      {
        showData ?
          showData.map((item, key) => {
            return (
              <p key={key}>{item?.snippet}</p>
            )
          })
          : ''
      }
    </div>
  );
}

export default App;
