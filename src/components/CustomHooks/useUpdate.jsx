import { useState, useEffect } from "react";
import axios from "axios";
import { notifyError } from "../admin/toastConfig";

const useUpdate = (url, payload) => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url || !payload) return;
    
    setLoading(true);
    axios.put(url, payload)
      .then((res) => setResponse(res.data))
      .catch((err) => {
        console.log(err);
        notifyError(err.response?.data?.message || "Failed to update item");
      })
      .finally(() => setLoading(false));
  }, [url, payload]);

  return { response, loading };
}

export default useUpdate;

