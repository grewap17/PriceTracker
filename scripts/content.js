

  

document.querySelectorAll('div').forEach(d => d.style.outline = '');

document.addEventListener('click', function (event) {


  if (['A', 'INPUT', 'TEXTAREA'].includes(event.target.tagName)) return;
  event.preventDefault();

  let node = event.target;
  while (node && node.tagName !== 'DIV') {
    node = node.parentElement;
  }

  if (node) {
    document.querySelectorAll('div').forEach(d => d.style.outline = '');
    node.style.outline = '3px solid blue';
    console.log('Clicked inside this div:', node);

    const htmlContent = node.outerHTML;
    sendPostRequest({ html: htmlContent });
  } else {
    console.log('No parent <div> found.');
  }
});

async function sendPostRequest(payload) {
  try {
    const response = await fetch('https://hokxb7pyk0.execute-api.us-east-1.amazonaws.com/default/PriceTracker', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    console.log('Success:', result);
  } catch (error) {
    console.log('Error:', error);
  }
}
