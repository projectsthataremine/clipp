import supabase from "@/utils/supabase/client";
import { useEffect, useState } from "react";

export default function useUser() {
  const [user, setUser] = useState<any>();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  return { user };
}
