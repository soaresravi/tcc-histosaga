const EMAIL_JS_CONFIG = {
    SERVICE_ID: 'service_rax0u7b',
    TEMPLATE_ID: 'template_u415zuk', 
    PUBLIC_KEY: 'U5FcdPXoRBcc7SRAA',
};

export const enviarCodigoVerificacao = async (email: string, codigo: string, nomeUsuario: string) => {
   
    try {
        
        const templateParams = {
            to_email: email,
            passcode: codigo,
            expiration_time: new Date(Date.now() + 15 * 60 * 1000).toLocaleString('pt-BR'),
            name: nomeUsuario
        };

        const formData = new FormData();

        formData.append('service_id', EMAIL_JS_CONFIG.SERVICE_ID);
        formData.append('template_id', EMAIL_JS_CONFIG.TEMPLATE_ID);
        formData.append('user_id', EMAIL_JS_CONFIG.PUBLIC_KEY);
        formData.append('template_params', JSON.stringify(templateParams));

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            body: formData,
        });

        console.log('Status da resposta:', response.status);
        
        if (response.ok) {
         
            console.log('✅ Email enviado com sucesso!');
            return true;
      
        } else {
         
            const errorData = await response.text();
          
            console.error('Erro:', {
                status: response.status,
                error: errorData
            });
            
            return await tentarMetodoJSON(email, codigo, nomeUsuario);
        }
        
    } catch (error) {
       
        console.error('Erro geral ao enviar email:', error);
        return await tentarMetodoJSON(email, codigo, nomeUsuario);
    }
};

const tentarMetodoJSON = async (email: string, codigo: string, nomeUsuario: string) => {
  
    try {
        console.log('🔄 Tentando método JSON...');
        
        const templateParams = {
            email: email,
            passcode: codigo,
            time: new Date(Date.now() + 15 * 60 * 1000).toLocaleString('pt-BR'),
            name: nomeUsuario
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
         
            method: 'POST',
          
            headers: {
              
                'Content-Type': 'application/json',
                'Origin': 'http://localhost' 
            },

            body: JSON.stringify({
                service_id: EMAIL_JS_CONFIG.SERVICE_ID,
                template_id: EMAIL_JS_CONFIG.TEMPLATE_ID,
                user_id: EMAIL_JS_CONFIG.PUBLIC_KEY,
                template_params: templateParams
            })
        });

        if (response.ok) {
          
            console.log('✅ Email enviado via método JSON!');
            return true;
     
        } else {
        
            const errorText = await response.text();
            console.error('Método JSON também falhou:', errorText);
           
            return false;
        }

    } catch (error) {
        console.error('Erro no método JSON:', error);
        return false;
    }
};