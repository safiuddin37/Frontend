import { useState, useEffect } from "react";
import axios from "axios";
import { notifyError } from "../admin/toastConfig";

const useDelete = (url) => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) return;
    
    setLoading(true);
    axios.delete(url)
      .then((res) => setResponse(res.data))
      .catch((err) => {
        console.log(err);
        notifyError(err.response?.data?.message || "Failed to delete item");
      })
      .finally(() => setLoading(false));
  }, [url]);

  return { response, loading };
}

export default useDelete;


