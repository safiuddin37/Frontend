import { useState } from "react";
import axios from "axios";
import { notifyError } from "../admin/toastConfig";

const usePost = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const post = async (url, payload) => {
    setLoading(true);
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      // Create headers with authorization
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      const res = await axios.post(url, payload, { headers });
      setResponse(res.data);
      return { data: res.data };
    } catch (err) {
      console.error("POST error:", {
        status: err.response?.status,
        message: err.response?.data?.message,
        payload,
        url
      });
      notifyError(err.response?.data?.message || "Something went wrong");
      return { error: err.response?.data?.message || "Request failed" };
    } finally {
      setLoading(false);
    }
  };
  

  return { post, response, loading };
};

export default usePost;









// import { useState, useEffect } from "react";
// import axios from "axios";
// import { notifyError } from "../admin/toastConfig";

// const usePost = (url, payload) => {
//   const [response, setResponse] = useState([]);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!url || !payload) return;
    
//     setLoading(true);
//     axios.post(url, payload)
//       .then((res) => setResponse(res.data))
//       .catch((err) => {
//         console.log(err);
//         notifyError(err.response?.data?.message || "Something went wrong");
//       })
//       .finally(() => setLoading(false));
//   }, [url, payload]);

//   return { response, loading };
// }

// export default usePost;




